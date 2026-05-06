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

#### Server -> Client (Incoming)
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

#### Client -> Server (Heartbeat)
```json
{
  "event": "ping",
  "timestamp": "2026-04-22T17:51:30Z"
}
```

#### Server -> Client (Heartbeat Response)
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
  student_id: UUID (FK -> students),
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

---

---

# Stage 4: Performance Solutions - Caching & Optimization Strategies

## Problem Statement

**Current Issue:**
The notification platform is experiencing performance bottlenecks:
- DB is getting overwhelmed with repeated reads for the same data
- Fetching notifications for each page load triggers multiple DB queries
- Real-time fetches for unread counts happening on every API call
- Network latency between app and database adds up quickly
- System struggles with 50K concurrent users checking notifications

---

## Performance Issues Analysis

### Issue 1: Repeated Database Queries
```
Each page load triggers:
  - GET /api/notifications (20 notifications) -> DB Query
  - GET /api/notifications/count/unread -> DB Query
  - WebSocket connection -> Real-time updates
  
With 50K concurrent students:
  50,000 × 2 queries = 100,000 DB queries per "page load cycle"
  Expected load: 500-1000 queries/second
  DB capacity: ~200-300 queries/second -> System OVERLOADED
```

### Issue 2: Network Latency
```
Single API call chain:
  Frontend Request
    -> Network (50ms)
      -> DB Query (20ms)
        -> Network (50ms)
          -> Frontend Response
  
  Total latency: 120ms per request
  With 3-5 requests per page: 360-600ms (noticeable delay)
```

### Issue 3: Cache Invalidation Complexity
```
Without proper caching:
- Same user notification list queried repeatedly
- Sorting/filtering results in memory repeatedly
- No way to serve stale-but-reasonable data
```

---

## Solution 1: Caching Strategy

### Caching Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                     │
│                  (In-Memory Cache)                        │
└────────────────────┬────────────────────────────────────┘
                     │ (Cache Hit/Miss)
┌────────────────────|────────────────────────────────────┐
│              Backend API Server                           │
│       (Application-Level Cache Layer)                     │
│         ┌─────────────────────────────────────┐          │
│         │  Redis Cache (5-minute TTL)        │          │
│         │  - User notification lists          │          │
│         │  - Unread counts                    │          │
│         │  - Recent searches                  │          │
│         └─────────────────────────────────────┘          │
└────────────────────┬────────────────────────────────────┘
                     │ (Cache Miss -> DB Query)
┌────────────────────|────────────────────────────────────┐
│                  PostgreSQL Database                      │
│              (Source of Truth)                            │
└─────────────────────────────────────────────────────────┘
```

### Cache Keys Strategy

```javascript
// User notifications list (paginated)
CACHE_KEY_NOTIFICATIONS = `notif:student:${studentId}:page:${pageNum}:limit:${limit}`
TTL = 5 minutes

// Unread count
CACHE_KEY_UNREAD_COUNT = `notif:student:${studentId}:unread:count`
TTL = 1 minute (more frequent updates)

// Notification type filter
CACHE_KEY_TYPE_FILTER = `notif:student:${studentId}:type:${type}:page:${pageNum}`
TTL = 5 minutes

// Global notification types list (shared across all students)
CACHE_KEY_NOTIFICATION_TYPES = `notif:types:list`
TTL = 24 hours (rarely changes)

// Placement notifications (last 7 days)
CACHE_KEY_PLACEMENT_RECENT = `notif:placement:recent:7days:page:${pageNum}`
TTL = 10 minutes
```

### Caching Implementation Pseudocode

```javascript
// GET /api/notifications endpoint
async function getNotifications(studentId, page = 1, limit = 20) {
  // Step 1: Check cache
  const cacheKey = `notif:student:${studentId}:page:${page}:limit:${limit}`;
  const cachedResult = await redis.get(cacheKey);
  
  if (cachedResult) {
    console.log("Cache HIT - Returning from Redis");
    return JSON.parse(cachedResult);  // 5-10ms response
  }
  
  // Step 2: Cache miss - query database
  console.log("Cache MISS - Querying database");
  const notifications = await db.query(`
    SELECT id, title, message, type, is_read, priority, created_at
    FROM notifications
    WHERE student_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT $2 OFFSET ${(page - 1) * limit}
  `, [studentId, limit]);
  
  // Step 3: Cache the result
  await redis.setex(cacheKey, 300, JSON.stringify(notifications));  // 5 min TTL
  
  return notifications;
}

// GET /api/notifications/count/unread endpoint
async function getUnreadCount(studentId) {
  // More aggressive caching for counts (1 minute TTL)
  const cacheKey = `notif:student:${studentId}:unread:count`;
  const cachedCount = await redis.get(cacheKey);
  
  if (cachedCount) {
    return { unreadCount: parseInt(cachedCount) };
  }
  
  const result = await db.query(`
    SELECT COUNT(*) as unread_count
    FROM notifications
    WHERE student_id = $1 AND is_read = false AND deleted_at IS NULL
  `, [studentId]);
  
  await redis.setex(cacheKey, 60, result.rows[0].unread_count);  // 1 min TTL
  
  return result.rows[0];
}
```

---

## Solution 2: Cache Invalidation Strategy

### When to Invalidate Cache

```
Event                          Cache Keys to Clear
────────────────────────────────────────────────────────────
Notification Created      ->    notif:student:{id}:*
                              notif:placement:recent:*
                              
Notification Marked Read  ->    notif:student:{id}:*
                              notif:student:{id}:unread:count
                              
Notification Deleted      ->    notif:student:{id}:*
                              notif:student:{id}:unread:count
                              
User Updates Profile      ->    notif:student:{id}:*
```

### Cache Invalidation Pseudocode

```javascript
// When marking notification as read
async function markAsRead(notificationId, studentId) {
  // Update database
  await db.query(`
    UPDATE notifications SET is_read = true WHERE id = $1
  `, [notificationId]);
  
  // Invalidate all affected cache keys
  const pattern = `notif:student:${studentId}:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);  // Remove all matching keys
  }
  
  // Also invalidate unread count cache (separate, shorter TTL)
  await redis.del(`notif:student:${studentId}:unread:count`);
  
  console.log(`Cache invalidated for student ${studentId}`);
}
```

---

## Solution 3: Database Connection Pooling

### Issue
```
Without pooling:
- Each request creates new DB connection
- Connection creation: 50-100ms overhead
- Connection overhead dominates actual query time
```

### Solution: Connection Pool
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'notifications_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,              
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Reuse connections from pool
const result = await pool.query('SELECT ...');  
```

---

## Solution 4: Frontend Caching

### Client-Side Caching Strategy

```javascript
// In React component
import { useQuery } from '@tanstack/react-query';

function NotificationList() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications', studentId, page],
    queryFn: () => fetchNotifications(studentId, page),
    staleTime: 5 * 60 * 1000,      // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,        // Keep in memory for 10 minutes
    refetchInterval: 30 * 1000,    // Auto-refresh every 30 seconds
  });

  return (
    <div>
      {notifications?.map(n => (
        <NotificationCard key={n.id} notification={n} />
      ))}
    </div>
  );
}
```

**Benefits:**
- Eliminates redundant API calls
- Faster page transitions
- Better perceived performance
- Reduces backend load by 60-70%

---

## Solution 5: Pagination & Lazy Loading

### Bad Approach (Fetch All)
```javascript
// DON'T: Fetch all notifications at once
SELECT * FROM notifications WHERE student_id = 1042;
// Returns 500 notifications × ~500 bytes = 250 KB of data
```

### Good Approach (Pagination)
```javascript
// Fetch page by page
SELECT * FROM notifications 
WHERE student_id = 1042 
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  // First 20 notifications = 10 KB

// Subsequent pages:
LIMIT 20 OFFSET 20;  // Next 20
LIMIT 20 OFFSET 40;  // Next 20
```

**Benefits:**
- Smaller payload per request
- Faster initial load
- Better mobile experience
- More responsive pagination

---

## Performance Comparison

### Before Optimization

| Operation | Time | DB Queries |
|-----------|------|-----------|
| Load notifications page | 600ms | 2 |
| Mark as read | 150ms | 1 |
| Get unread count | 100ms | 1 |
| **Total per session** | **850ms** | **4** |
| **50K users × 4 queries** | — | **200K/min** |

### After Optimization

| Operation | Time | DB Queries |
|-----------|------|-----------|
| Load notifications (cached) | 15ms | 0 (Redis) |
| Mark as read | 50ms | 1 |
| Get unread count (cached) | 5ms | 0 (Redis) |
| **Total per session** | **70ms** | **1** |
| **50K users × 1 query** | — | **50K/min** |

**Improvement:**
- Page load: 600ms -> 15ms
- Overall response: 850ms -> 70ms
- DB load: 200K -> 50K queries/min
- Can now handle 200K concurrent users (was 50K before)

---

## Solution 6: Database Query Optimization

### Use Materialized Views for Complex Queries

```sql
-- Materialized view for students with recent placement notifications
CREATE MATERIALIZED VIEW placement_notifications_summary AS
SELECT 
  s.id,
  s.roll_number,
  s.email,
  COUNT(n.id) as placement_count,
  MAX(n.created_at) as latest_placement
FROM students s
LEFT JOIN notifications n ON s.id = n.student_id 
  AND n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days'
  AND n.deleted_at IS NULL
GROUP BY s.id, s.roll_number, s.email;

-- Refresh periodically (every 1 hour)
REFRESH MATERIALIZED VIEW placement_notifications_summary;

-- Query becomes simple and fast
SELECT * FROM placement_notifications_summary 
WHERE placement_count > 0
ORDER BY latest_placement DESC;
```

---

---

# Stage 5: Bulk Notification System - "Notify All" Scenario

## Problem Statement

**Real-world Scenario:**
It's placement season. The HR clicks "Notify All" to send notifications to **50,000 students** about a new company (CSX Corporation) hiring drive. The system needs to:
1. Send email to all students
2. Save notification in database
3. Push real-time notification to app
4. Do all of this **simultaneously and reliably**

---

## Naive Implementation (PROBLEMATIC)

### Pseudocode
```javascript
function notify_all(student_ids, message) {
  for each student_id in student_ids:
    send_email(student_id, message)        // Calls Email API
    save_to_db(student_id, message)        // DB insert
    push_to_app(student_id, message)       // Real-time push
}
```

---

## Shortcomings Analysis

### Issue 1: Synchronous Blocking
```
Time for 50,000 students:
- send_email(): 100ms each × 50,000 = 5,000 seconds (1.4 HOURS!)
- save_to_db(): 20ms each × 50,000 = 1,000 seconds
- push_to_app(): 50ms each × 50,000 = 2,500 seconds

Total: ~4.4 HOURS of blocking!

API Response: Hangs for hours... (User thinks system is down)
```

### Issue 2: No Fault Tolerance
```
If send_email() fails for student #200 out of 50,000:
- Process stops completely
- Previous 199 students got email
- Remaining 49,800 students got nothing
- No way to retry or resume

Logs indicate: "send_email failed for 200 students midway"
→ What now? Restart and resend to all? (Duplicate emails!)
→ Or just fail silently? (Data inconsistency)
```

---

## Solution: Queue-Based Architecture

### Revised Pseudocode

```javascript
// ENTRY POINT: HR clicks "Notify All"
function notify_all(student_ids, message) {
  // Step 1: Create batch job (non-blocking)
  batch_job = {
    id: generate_unique_id(),
    total_recipients: 50000,
    status: "queued",
    created_at: now()
  }
  
  // Step 2: Queue the job and return immediately
  queue.push(batch_job)
  
  // Step 3: Return to user instantly
  return {
    job_id: batch_job.id,
    status: "queued",
    message: "Notifications queued. Check progress with job_id"
  }
  
  // Step 4: Background worker processes asynchronously
  // (This happens independently, doesn't block the API)
}

// BACKGROUND WORKER: Processes queued jobs
function background_worker() {
  while (queue_has_jobs) {
    job = queue.dequeue()
    batch_job = {
      ...job,
      status: "processing",
      started_at: now()
    }
    
    try {
      process_batch_notifications(job.student_ids, job.message)
      batch_job.status = "completed"
      batch_job.completed_at = now()
    } catch (error) {
      batch_job.status = "failed"
      batch_job.error = error.message
    }
    
    save_batch_status(batch_job)
  }
}

// CHUNKED PROCESSING: Split work into manageable pieces
function process_batch_notifications(student_ids, message) {
  chunk_size = 100
  
  for each chunk of 100 students:
    try {
      // Transaction: All-or-nothing for this chunk
      transaction {
        save_notifications_to_db(chunk, message)      // DB insert (1 transaction)
        send_emails_async(chunk, message)              // Async email (non-blocking)
        push_to_app_async(chunk, message)              // Async push (non-blocking)
      }
      
      log("Chunk processed. Progress: X/50000")
    } catch (chunk_error) {
      log_error("Chunk failed. Retrying...")
      retry_with_exponential_backoff(3 times)  // Retry logic
    }
}

// INDEPENDENT OPERATIONS: Don't wait for each other
async function send_emails_async(chunk, message) {
  try {
    // Fire and forget - don't wait for response
    email_service.send_bulk(chunk, message)
  } catch (error) {
    log_error("Email send failed for chunk", error)
    // Continue anyway - app notification is more important
  }
}

async function push_to_app_async(chunk, message) {
  try {
    websocket_service.push_bulk(chunk, message)
  } catch (error) {
    log_error("Push failed for chunk", error)
    // Continue anyway - emails were already sent
  }
}
```

---

## Key Design Decisions

### 1. Database Save is the Source of Truth
```
Priority Order:
1. save_to_db() - CRITICAL (must succeed)
2. send_email() - IMPORTANT (async, optional failure)
3. push_to_app() - NICE-TO-HAVE (async, optional failure)

Reasoning:
- Database is the authoritative record
- If DB save fails, retry entire chunk
- If email fails, student still sees notification in app
- If push fails, student can refresh app later
```

### 2. Atomic Database Transactions
```sql
BEGIN TRANSACTION;
  INSERT INTO notifications (student_id, title, message, type, priority)
  VALUES (student_1, ...), (student_2, ...), ..., (student_100, ...);
COMMIT;

Benefits:
- All 100 notifications inserted or none
- No partial failures
- Consistent database state
```

### 3. Non-Blocking Queue Processing
```
API Request (blocking):   100ms  → Returns job_id
Queue Processing (async): 2-3 minutes in background → No blocking
Total user wait: ~100ms (acceptable)
```

### 4. Retry Logic with Exponential Backoff
```
Chunk fails:
  Retry 1: Wait 2 seconds, retry
  Retry 2: Wait 4 seconds, retry
  Retry 3: Wait 8 seconds, retry
  All fail: Log permanent failure, continue with next chunk

Result: ~95% success rate for flaky operations
```

### 5. Chunking for Resource Efficiency
```
Instead of: 50,000 operations at once (crashes)
Process: 500 chunks of 100 operations each

Benefits:
- Memory efficient
- Database connection pool can handle
- Can pause/resume easily
- Better error isolation
```

### 6. Progress Tracking
```
Store in Redis:
{
  "batch_job_id": {
    "status": "processing",
    "processed": 12500,
    "total": 50000,
    "percentage": 25,
    "started_at": "2026-04-22T17:51:30Z"
  }
}

Client polls: GET /api/notifications/batch/:jobId
Response: { processed: 12500, total: 50000, percentage: 25 }
```

---

## Should Database Save and Email Happen Together?

### Answer: NO

```javascript
// WRONG: Both happen synchronously
transaction {
  save_to_db()
  send_email()  // If this takes 100ms × 50000 = hours!
  push_to_app()
}

// RIGHT: DB is critical, email is fire-and-forget
transaction {
  save_to_db()  // Must succeed (critical)
}

// Then independently:
send_email_async()    // Fire and forget
push_to_app_async()   // Fire and forget
```

### Why Not Together?

1. **DB is small and fast**
2. **Email API is slow**
3. **Can't hold a transaction open during network call**
   - Locks table
   - Blocks other operations
   - Wastes database connections

4. **Decoupling improves reliability**
   - If email fails, DB is already updated
   - Student can still see notification in app
   - No cascading failures

---

---


