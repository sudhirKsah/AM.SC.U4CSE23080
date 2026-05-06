import axios from 'axios';

export type Stack = 'backend' | 'frontend';
export type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type BackendPackage =
  | 'cache'
  | 'controller'
  | 'cron_job'
  | 'db'
  | 'domain'
  | 'handler'
  | 'repository'
  | 'route'
  | 'service';

export type FrontendPackage =
  | 'api'
  | 'component'
  | 'hook'
  | 'page'
  | 'state'
  | 'style';

export type SharedPackage =
  | 'auth'
  | 'config'
  | 'middleware'
  | 'utils';

export type Package = BackendPackage | FrontendPackage | SharedPackage;

interface LogResponse {
  logID: string;
  message: string;
}

interface LogRequest {
  stack: Stack;
  level: Level;
  package: Package;
  message: string;
}

/**
 * logger.log('backend', 'info', 'controller', 'User notification fetched successfully');
 */
class LoggerService {
  private readonly API_ENDPOINT = 'http://20.207.122.201/evaluation-service/logs';
  private readonly TIMEOUT = 5000;
  private logQueue: LogRequest[] = [];
  private isProcessing = false;

  async log(
    stack: Stack,
    level: Level,
    packageName: Package,
    message: string
  ): Promise<LogResponse | null> {
    this.validateInputs(stack, level, packageName, message);

    const logRequest: LogRequest = {
      stack: stack.toLowerCase() as Stack,
      level: level.toLowerCase() as Level,
      package: packageName.toLowerCase() as Package,
      message,
    };

    // For production, use queue; for development, log immediately
    if (process.env.NODE_ENV === 'production') {
      return this.queueAndProcessLog(logRequest);
    }

    return this.sendLog(logRequest);
  }

  private async queueAndProcessLog(
    logRequest: LogRequest
  ): Promise<LogResponse | null> {
    this.logQueue.push(logRequest);

    if (!this.isProcessing && this.logQueue.length >= 10) {
      this.processBatch();
    }

    if (this.logQueue.length === 1) {
      return this.sendLog(logRequest);
    }

    return null;
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.logQueue.splice(0, 10);

    try {
      await Promise.allSettled(
        batch.map((log) => this.sendLog(log))
      );
    } catch (error) {
      console.error('Error processing log batch:', error);
    } finally {
      this.isProcessing = false;

      if (this.logQueue.length > 0) {
        this.processBatch();
      }
    }
  }

  private async sendLog(logRequest: LogRequest): Promise<LogResponse | null> {
    try {
      const response = await axios.post<LogResponse>(
        this.API_ENDPOINT,
        logRequest,
        {
          timeout: this.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      // log silently to prevent breaking application flow
      if (error instanceof axios.AxiosError) {
        console.warn(
          `Failed to send log: ${error.message}`,
          `Stack: ${logRequest.stack}`,
          `Level: ${logRequest.level}`
        );
      }
      return null;
    }
  }

  private validateInputs(
    stack: string,
    level: string,
    packageName: string,
    message: string
  ): void {
    const validStacks: Stack[] = ['backend', 'frontend'];
    const validLevels: Level[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const validBackendPackages: BackendPackage[] = [
      'cache',
      'controller',
      'cron_job',
      'db',
      'domain',
      'handler',
      'repository',
      'route',
      'service',
    ];
    const validFrontendPackages: FrontendPackage[] = [
      'api',
      'component',
      'hook',
      'page',
      'state',
      'style',
    ];
    const validSharedPackages: SharedPackage[] = [
      'auth',
      'config',
      'middleware',
      'utils',
    ];

    if (!validStacks.includes(stack.toLowerCase() as Stack)) {
      throw new Error(
        `Invalid stack: ${stack}. Must be one of: ${validStacks.join(', ')}`
      );
    }

    if (!validLevels.includes(level.toLowerCase() as Level)) {
      throw new Error(
        `Invalid level: ${level}. Must be one of: ${validLevels.join(', ')}`
      );
    }

    const lowerPackage = packageName.toLowerCase();
    const isValidBackendPackage = validBackendPackages.includes(
      lowerPackage as BackendPackage
    );
    const isValidFrontendPackage = validFrontendPackages.includes(
      lowerPackage as FrontendPackage
    );
    const isValidSharedPackage = validSharedPackages.includes(
      lowerPackage as SharedPackage
    );

    if (
      !isValidBackendPackage &&
      !isValidFrontendPackage &&
      !isValidSharedPackage
    ) {
      throw new Error(
        `Invalid package: ${packageName}. ` +
        `Backend packages: ${validBackendPackages.join(', ')}. ` +
        `Frontend packages: ${validFrontendPackages.join(', ')}. ` +
        `Shared packages: ${validSharedPackages.join(', ')}`
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }
  }

  debug(packageName: Package, message: string, stack: Stack = 'backend'): Promise<LogResponse | null> {
    return this.log(stack, 'debug', packageName, message);
  }

  info(packageName: Package, message: string, stack: Stack = 'backend'): Promise<LogResponse | null> {
    return this.log(stack, 'info', packageName, message);
  }

  warn(packageName: Package, message: string, stack: Stack = 'backend'): Promise<LogResponse | null> {
    return this.log(stack, 'warn', packageName, message);
  }

  error(packageName: Package, message: string, stack: Stack = 'backend'): Promise<LogResponse | null> {
    return this.log(stack, 'error', packageName, message);
  }

  fatal(packageName: Package, message: string, stack: Stack = 'backend'): Promise<LogResponse | null> {
    return this.log(stack, 'fatal', packageName, message);
  }
}

export const logger = new LoggerService();
export default LoggerService;
