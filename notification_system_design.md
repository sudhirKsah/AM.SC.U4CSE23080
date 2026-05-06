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

## Summary

This Stage 1 design provides a comprehensive REST API for the notification system with:
- 5 core REST endpoints for CRUD operations
- WebSocket support for real-time notifications
- Clear JSON schemas for all requests and responses
- Error handling guidelines
- Security best practices

The design is scalable and can handle high volume of notifications across thousands of students.
