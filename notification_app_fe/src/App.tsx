import { useState } from 'react';
import { logger } from 'logging-middleware';
import AllNotificationsPage from './pages/AllNotificationsPage';
import PriorityInboxPage from './pages/PriorityInboxPage';
import './index.css';

type Tab = 'all' | 'priority';

export default function App() {
  const [tab, setTab] = useState<Tab>('all');

  const switchTab = (t: Tab) => {
    logger.info('component', `Tab switched to: ${t}`);
    setTab(t);
  };

  return (
    <div className="app">
      <header>
        <div className="header-logo">
          <span>Notify</span>Hub
        </div>
        <nav>
          <button className={`nav-btn${tab === 'all' ? ' active' : ''}`} onClick={() => switchTab('all')}>
            All Notifications
          </button>
          <button className={`nav-btn${tab === 'priority' ? ' active' : ''}`} onClick={() => switchTab('priority')}>
            Priority Inbox
          </button>
        </nav>
      </header>
      <main>
        {tab === 'all' ? <AllNotificationsPage /> : <PriorityInboxPage />}
      </main>
    </div>
  );
}
