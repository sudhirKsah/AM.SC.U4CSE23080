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

---

# Stage 3: Query Optimization and Performance Analysis

## Scenario Context

**Current State:**
- Database has grown to **50,000 students**
- **5,000,000+ notifications** in the system
- The notification API is experiencing performance issues
- A developer wrote a query to fetch unread notifications that is now performing slowly

---

## The Problematic Query

### Original Query (SLOW)
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

---

## Analysis: Why Is This Query Slow?

### Problem Breakdown:

1. **Full Table Scan Required**
   - Without indexes, the database must scan ALL 5,000,000 rows
   - For each row, check if studentID = 1042 AND isRead = false
   - Filter millions of rows to find maybe 20-30 notifications
   - Performance: **Could take 2-5 SECONDS** on a large table

2. **No Index Support**
   - The database engine cannot use indexes to speed up the filtering
   - Must evaluate every single row

3. **Additional Issues**
   - `SELECT *` fetches all columns including potentially large `metadata` JSONB field
   - Sorting by `createdAt` without an index requires sorting in memory
   - With 5M rows, this is extremely expensive

### Estimated Query Cost:
- **Without Index:** ~2000-5000ms
- **With Composite Index:** ~10-50ms

---

## Solution: Strategic Indexing

### Why Add Indexes?

**Benefits:**
1. Reduce full table scans to index lookups
2. Database can find matching rows in O(log n) time instead of O(n)
3. On 5M rows: **100x faster** query execution
4. Minimal storage overhead for indices

### Index Strategy

#### Primary Index (CRITICAL)
```sql
CREATE INDEX idx_notifications_student_id_is_read ON notifications(student_id, is_read);
```

**Why Composite Index?**
- First filters by `student_id` (narrow down from 5M to ~50 rows per student)
- Then filters by `is_read` (further narrow to ~20-30 unread)
- Database uses this index to satisfy both WHERE conditions efficiently

#### Secondary Indexes (Supporting)
```sql
CREATE INDEX idx_notifications_student_id_created_at ON notifications(student_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

---

## Optimized Query

### Improved Query (FAST)
```sql
SELECT 
  id,
  student_id,
  title,
  message,
  type,
  priority,
  is_read,
  metadata,
  created_at,
  updated_at
FROM notifications
WHERE student_id = 1042 
  AND is_read = false
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Key Improvements:
1. **Selective columns** - Instead of SELECT *, only fetch needed columns
2. **Composite index support** - Leverages idx_notifications_student_id_is_read
3. **Soft delete consideration** - Excludes deleted records
4. **Better sort order** - Most recent notifications first (DESC)

### Performance Comparison:

| Aspect | Before | After |
|--------|--------|-------|
| Query Time | 2-5 seconds | 10-50 milliseconds |
| Rows Scanned | 5,000,000 | ~30 |
| Index Usage | None | Composite Index |
| Result Set | All columns | Needed columns only |
| **Improvement Factor** | — | **100-500x faster** |

---

## Query Optimization Techniques

### 1. Column Selection
```sql
-- BAD: Fetches unnecessary data
SELECT * FROM notifications WHERE student_id = 1042;

-- GOOD: Only what's needed
SELECT id, title, message, type, is_read, created_at
FROM notifications WHERE student_id = 1042;
```

### 2. Filtering with Indexes
```sql
-- BAD: Function calls prevent index usage
SELECT * FROM notifications 
WHERE YEAR(created_at) = 2026;

-- GOOD: Date range filtering preserves index
SELECT * FROM notifications 
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
```

### 3. Pagination
```sql
-- GOOD: Limit results to prevent loading entire result set
SELECT id, title, message, type, is_read, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = false
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

## Advanced Query: Find Students with Placement Notifications (Last 7 Days)

### Business Requirement
"Find all students who received a Placement notification in the last 7 days"

### Solution Query
```sql
SELECT DISTINCT
  s.id,
  s.roll_number,
  s.email,
  s.name,
  COUNT(n.id) as placement_notification_count,
  MAX(n.created_at) as latest_placement_notification
FROM students s
INNER JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days'
  AND n.deleted_at IS NULL
GROUP BY s.id, s.roll_number, s.email, s.name
ORDER BY latest_placement_notification DESC;
```

### Query Explanation:

1. **INNER JOIN** - Connect students with their notifications
2. **WHERE n.type = 'Placement'** - Filter for placement type only
3. **n.created_at >= NOW() - INTERVAL '7 days'** - Last 7 days constraint
4. **DISTINCT** - Avoid duplicate students
5. **GROUP BY** - Aggregate notifications per student
6. **COUNT(n.id)** - How many placement notifications each student got
7. **MAX(n.created_at)** - When was the most recent one

### Supporting Indexes for This Query
```sql
CREATE INDEX idx_notifications_type_created_at ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_student_id_type_created_at ON notifications(student_id, type, created_at DESC);
```

### Expected Result
```
id              | roll_number | email           | name          | placement_notification_count | latest_placement_notification
uuid_1          | AM.SC.23001 | std1@abc.edu    | Raj Kumar     | 3                            | 2026-04-22 17:51:30
uuid_2          | AM.SC.23002 | std2@abc.edu    | Priya Singh   | 2                            | 2026-04-22 17:45:12
uuid_3          | AM.SC.23003 | std3@abc.edu    | Amit Sharma   | 1                            | 2026-04-21 16:30:45
```

### Query Performance
- **Expected execution time:** < 200ms
- **Rows processed:** ~50,000 (student count) + ~1M (recent placement notifications)
- **Index benefit:** Reduces processed rows by 80%

---

## Summary: Stage 3 Conclusions

### Key Findings:

1. **Original Query Issue:** Full table scan on 5M rows without indexes
2. **Root Cause:** Missing composite index on (student_id, is_read)
3. **Impact:** 2-5 second query response (unacceptable for API)
4. **Solution:** Strategic indexes reduce query time to 10-50ms

### Recommendations:

**DO add indexes:**
- Composite index on (student_id, is_read)
- Index on (type, created_at) for filtering by notification type
- Index on (student_id, created_at) for sorting queries

**DO optimize queries:**
- Select only needed columns
- Use LIMIT for pagination
- Use date ranges instead of function calls
- Add soft delete checks

**Monitor Performance:**
- Track query execution times
- Monitor index usage statistics
- Plan index maintenance during off-peak hours


