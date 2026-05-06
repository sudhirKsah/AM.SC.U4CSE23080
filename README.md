# Campus Notification Platform – NotifyHub

A production-grade notification system built for students to receive real-time updates on **Placements, Results, and Events**. This project features a custom logging middleware, a proxy backend with priority scoring, and a modern responsive frontend.

---

## Project Structure

The repository is organized into three main components:

### 1. [Logging Middleware](file:///home/sudhir/Storage1/placement/logging_middleware)
A reusable TypeScript package that handles centralized logging.
- **Goal**: Captures application events and sends them to the evaluation server.
- **Features**: Reusable `Log` function, input validation, and Bearer token authentication.

### 2. [Notification Backend (BE)](file:///home/sudhir/Storage1/placement/notification_app_be)
A minimal Express.js server built with TypeScript.
- **Goal**: Proxies the upstream notification API and implements business logic.
- **Features**: 
  - **Priority Inbox Logic**: Custom algorithm that ranks notifications based on weight (`Placement` > `Result` > `Event`) and recency.
  - **Environment Config**: Managed via `.env`.
  - **Clean Architecture**: Function-style Express implementation.

### 3. [Notification Frontend (FE)](file:///home/sudhir/Storage1/placement/notification_app_fe)
A modern React application built with Vite and Vanilla CSS.
- **Goal**: User interface for students to view and filter notifications.
- **Features**:
  - **All Notifications Page**: With type-based filtering and pagination.
  - **Priority Inbox Page**: Displays the most important updates at a glance.
  - **Visual Cues**: Distinguishes between new and viewed notifications using `localStorage`.
  - **Responsive Design**: Optimized for both desktop and mobile views.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Setup

1. **Setup Logging Middleware**
   ```bash
   cd logging_middleware
   npm install
   npm run build
   ```

2. **Setup Backend**
   ```bash
   cd ../notification_app_be
   npm install
   # Ensure .env is configured with correct AUTH_TOKEN
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../notification_app_fe
   npm install
   npm run dev
   ```

---

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Vanilla CSS
- **Backend**: Express.js, TypeScript, Axios
- **Logging**: Custom TS Middleware
- **Database**: PostgreSQL (pg pool configured for future persistence)

## Design Documentation
The detailed system design and evolution through different stages can be found in [notification_system_design.md](file:///home/sudhir/Storage1/placement/notification_system_design.md).

---
