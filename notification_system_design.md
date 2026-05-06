# Notification System Design

## Stage 1: REST API Design and Real-time Notification Mechanism

### Overview
This document defines the REST API contract for the notification system. The system handles sending, fetching, and managing notifications for students in a campus placement platform.

---

## Core Actions

The notification platform should support the following core actions:

1. **Send Notification** - Send notifications to one or multiple students
2. **Fetch Notifications** - Retrieve notifications for a logged-in student
3. **Mark as Read** - Mark a notification as read
4. **Delete Notification** - Remove a notification
5. **Get Unread Count** - Get count of unread notifications for a student

---

## API Endpoints

### 1. Send Notification
**Endpoint:** `POST /api/notifications/send`

**Authentication:** Required (Admin/HR)

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

**Request Body:**
```json
{
  "recipientIds": ["student_id_1", "student_id_2"],
  "title": "Placement Update",
  "message": "CSX Corporation is hiring!",
  "notificationType": "Event",
  "priority": "high",
  "metadata": {
    "companyId": "company_123",
    "eventId": "event_456"
  }
}
```

**Response (Status: 201 Created):**
```json
{
  "success": true,
  "data": {
    "notificationIds": ["notif_001", "notif_002"],
    "sentCount": 2,
    "failureCount": 0,
    "timestamp": "2026-04-22T17:51:30Z"
  },
  "message": "Notifications sent successfully"
}
```

---

### 2. Fetch Notifications
**Endpoint:** `GET /api/notifications?limit=10&page=1&notificationType=Event`

**Authentication:** Required (Student)

**Query Parameters:**
- `limit` (optional, default: 20) - Number of notifications per page
- `page` (optional, default: 1) - Page number
- `notificationType` (optional) - Filter by type: "Event", "Result", "Placement"

**Response (Status: 200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "type": "Result",
        "title": "Mid-Semester Results",
        "message": "mid-sem",
        "timestamp": "2026-04-22T17:51:30Z",
        "isRead": false,
        "priority": "high",
        "metadata": {
          "examId": "exam_789"
        }
      },
      {
        "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
        "type": "Placement",
        "title": "Company Hiring",
        "message": "CSX Corporation hiring",
        "timestamp": "2026-04-22T17:51:18Z",
        "isRead": true,
        "priority": "medium",
        "metadata": {
          "companyId": "company_123"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 95,
      "pageSize": 20
    }
  }
}
```

---

### 3. Mark Notification as Read
**Endpoint:** `PATCH /api/notifications/:notificationId/read`

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "isRead": true
}
```

**Response (Status: 200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "isRead": true,
    "updatedAt": "2026-04-22T17:52:00Z"
  }
}
```

---

### 4. Delete Notification
**Endpoint:** `DELETE /api/notifications/:notificationId`

**Authentication:** Required (Student/Admin)

**Response (Status: 200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "deletedAt": "2026-04-22T17:52:30Z"
  },
  "message": "Notification deleted successfully"
}
```

---

### 5. Get Unread Count
**Endpoint:** `GET /api/notifications/count/unread`

**Authentication:** Required (Student)

**Response (Status: 200 OK):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 12
  }
}
```

---

## Real-time Notification Mechanism

### WebSocket Connection
For real-time notifications, implement WebSocket support:

**Connection URL:** `ws://localhost:3000/api/notifications/ws?token=<jwt_token>`

**Connection Flow:**
```
1. Client connects to WebSocket endpoint with authentication token
2. Server validates token and establishes connection
3. Server subscribes client to student-specific notification channel
4. When notification is sent to student, server pushes via WebSocket
5. Client receives notification in real-time and updates UI
```

**WebSocket Events:**

#### Server → Client (Incoming)
```json
{
  "event": "notification:new",
  "data": {
    "id": "notif_xyz",
    "type": "Event",
    "title": "Tech Fest 2026",
    "message": "Registration is now open",
    "timestamp": "2026-04-22T17:51:30Z"
  }
}
```

#### Client → Server (Heartbeat)
```json
{
  "event": "ping",
  "timestamp": "2026-04-22T17:51:30Z"
}
```

#### Server → Client (Heartbeat Response)
```json
{
  "event": "pong",
  "timestamp": "2026-04-22T17:51:31Z"
}
```

---

## Data Model

### Notification Schema
```json
{
  "id": "uuid",
  "studentId": "string",
  "type": "enum: Event | Result | Placement",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "priority": "enum: low | medium | high",
  "metadata": {
    "companyId": "optional string",
    "examId": "optional string",
    "eventId": "optional string"
  },
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "deletedAt": "optional ISO 8601 timestamp"
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid query parameters"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token is missing or invalid"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Notification with ID not found"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An internal server error occurred"
  }
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require JWT token validation
2. **Authorization**: Students can only access their own notifications
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Data Validation**: Validate all input data on both client and server
5. **HTTPS/WSS**: Use secure connections for all communications

---

---

# Stage 2: Database Design and Persistent Storage

## Overview
This stage focuses on designing a persistent storage solution for the notification system. We'll analyze database options, design the schema, and provide SQL queries for storing and retrieving notifications efficiently.

## Database Choice Analysis

### Options Considered:

1. **Relational Database (MySQL/PostgreSQL)**
   - ACID compliance
   - Complex queries support
   - Indexing capabilities
   - Best for structured data like notifications
   - May require optimization for high volume reads

2. **NoSQL Database (MongoDB)**
   - Flexible schema
   - Horizontal scalability
   - Less reliable for transactional consistency
   - Requires denormalization strategies

### **Recommended: Relational Database (PostgreSQL/MySQL)**

**Reasoning:**
- Notifications are structured data with relationships (student ↔ notification)
- ACID properties ensure data integrity
- Efficient indexing for query optimization
- Strong consistency requirements
- Better for complex filtering and pagination

---

## Database Schema

### Tables Design

#### 1. **students** Table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile_no VARCHAR(15),
  github_username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_email ON students(email);
```

#### 2. **notifications** Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_notifications_student_id ON notifications(student_id);
CREATE INDEX idx_notifications_student_id_is_read ON notifications(student_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_student_id_deleted_at ON notifications(student_id, deleted_at);
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### 3. **notification_read_history** Table (Optional - for audit trail)
```sql
CREATE TABLE notification_read_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_read_history_notification_id ON notification_read_history(notification_id);
CREATE INDEX idx_read_history_student_id ON notification_read_history(student_id);
```

---

## Core SQL Queries

### 1. Insert a Single Notification
```sql
INSERT INTO notifications (student_id, title, message, type, priority, metadata)
SELECT 
  s.id,
  'Placement Update',
  'CSX Corporation is hiring!',
  'Placement',
  'high',
  jsonb_build_object('companyId', 'company_123', 'eventId', 'event_456')
FROM students s
WHERE s.roll_number = ?;
```

### 2. Insert Multiple Notifications (Batch)
```sql
INSERT INTO notifications (student_id, title, message, type, priority, metadata)
VALUES 
  ((SELECT id FROM students WHERE roll_number = ?), 'Title', 'Message', 'Event', 'high', '{}'),
  ((SELECT id FROM students WHERE roll_number = ?), 'Title', 'Message', 'Result', 'medium', '{}')
RETURNING id, student_id, title, message, created_at;
```

### 3. Fetch Notifications with Pagination
```sql
SELECT 
  id,
  title,
  message,
  type,
  is_read,
  priority,
  metadata,
  created_at,
  updated_at
FROM notifications
WHERE student_id = ? AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### 4. Fetch Notifications with Type Filter
```sql
SELECT 
  id,
  title,
  message,
  type,
  is_read,
  priority,
  metadata,
  created_at,
  updated_at
FROM notifications
WHERE student_id = ? 
  AND deleted_at IS NULL 
  AND type = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### 5. Mark Notification as Read
```sql
UPDATE notifications
SET is_read = true, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND student_id = ?
RETURNING id, is_read, updated_at;
```

### 6. Delete Notification (Soft Delete)
```sql
UPDATE notifications
SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND student_id = ?
RETURNING id, deleted_at;
```

### 7. Get Unread Count
```sql
SELECT COUNT(*) as unread_count
FROM notifications
WHERE student_id = ? 
  AND is_read = false 
  AND deleted_at IS NULL;
```

### 8. Get Unread Count by Type
```sql
SELECT 
  type,
  COUNT(*) as count
FROM notifications
WHERE student_id = ? 
  AND is_read = false 
  AND deleted_at IS NULL
GROUP BY type;
```

### 9. Get Total Notifications Count
```sql
SELECT COUNT(*) as total_count
FROM notifications
WHERE student_id = ? AND deleted_at IS NULL;
```

### 10. Hard Delete Old Notifications (Cleanup Query)
```sql
DELETE FROM notifications
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '90 days';
```

---

## Query Performance Considerations

### Current Problem Scenario (Stage 3)
**Slow Query Example:**
```sql
SELECT * FROM notifications
WHERE student_id = 1042 AND is_read = false
ORDER BY created_at ASC;
```

**Issue:** Without proper indexing, this query scans entire table.

**Solution:** The index `idx_notifications_student_id_is_read` on `(student_id, is_read)` enables the database to:
- Use index to filter by student_id
- Quickly identify unread records
- Return results efficiently even with 5M+ notifications

### Expected Query Performance with Indexes:
- Fetching 20 notifications for a student: **< 50ms**
- Getting unread count: **< 10ms**
- Marking notification as read: **< 5ms**

---

## Data Model Summary

### Notification Entity
```
{
  id: UUID,
  student_id: UUID (FK → students),
  title: String,
  message: Text,
  type: Enum('Event', 'Result', 'Placement'),
  priority: Enum('low', 'medium', 'high'),
  is_read: Boolean,
  metadata: JSON (flexible for storing related IDs),
  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp (for soft delete)
}
```

### Key Design Decisions:
1. **UUID Primary Keys:** Better for distributed systems and replication
2. **Soft Deletes:** Preserve data for audit trails while hiding from queries
3. **JSONB Metadata:** Flexible storage for company/event/exam IDs without schema changes
4. **Composite Indexes:** Optimize common query patterns (student_id + is_read)
5. **Timestamps:** Track creation, updates, and logical deletion

---

