# Notification System Design

---

## Stage 1 – REST API Design

### Purpose
A notification system that delivers Placement, Result, and Event notifications to students in real time with priority ordering and read/unread tracking.

### API Endpoints

#### 1. GET /notifications
Fetch paginated list of notifications for the authenticated student.

**Headers**
```
Authorization: Bearer <token>
```

**Query Parameters**
| Param              | Type   | Required | Description                          |
|--------------------|--------|----------|--------------------------------------|
| page               | number | No       | Page number (default: 1)             |
| limit              | number | No       | Items per page (default: 10)         |
| notification_type  | string | No       | Filter: placement, result, event     |

**Response 200**
```json
{
  "notifications": [
    {
      "notificationId": "abc123",
      "title": "TCS Drive",
      "message": "TCS is visiting on July 10",
      "notification_type": "placement",
      "isRead": false,
      "createdAt": "2024-07-01T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**Error Codes**
| Code | Meaning              |
|------|----------------------|
| 401  | Unauthorized         |
| 500  | Internal Server Error|

---

#### 2. GET /notifications/:id
Fetch a single notification by ID.

**Headers**
```
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "notificationId": "abc123",
  "title": "TCS Drive",
  "message": "TCS is visiting on July 10",
  "notification_type": "placement",
  "isRead": false,
  "createdAt": "2024-07-01T10:00:00Z"
}
```

**Error Codes**
| Code | Meaning      |
|------|--------------|
| 404  | Not Found    |
| 401  | Unauthorized |

---

#### 3. POST /notifications
Create a new notification (admin/system only).

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "Result Published",
  "message": "Semester 4 results are out",
  "notification_type": "result",
  "targetStudents": ["all"]
}
```

**Response 201**
```json
{
  "notificationId": "xyz789",
  "message": "Notification created successfully"
}
```

**Error Codes**
| Code | Meaning           |
|------|-------------------|
| 400  | Validation Error  |
| 401  | Unauthorized      |

---

#### 4. PATCH /notifications/:id/read
Mark a notification as read.

**Headers**
```
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "notificationId": "abc123",
  "isRead": true
}
```

---

#### 5. PATCH /notifications/read-all
Mark all notifications as read for the current user.

**Response 200**
```json
{ "message": "All notifications marked as read" }
```

---

#### 6. DELETE /notifications/:id
Delete a notification (admin only).

**Response 200**
```json
{ "message": "Notification deleted" }
```

---

## Stage 2 – Database Design

### Chosen Database: MongoDB

#### Why MongoDB over SQL?

Notifications have **flexible, varying schemas**:

- **Placement** notification needs: `company`, `salary`, `deadline`, `venue`
- **Result** notification needs: `semester`, `cgpa`, `subject`
- **Event** notification needs: `speaker`, `venue`, `eventDate`

With SQL, you'd need either a wide table with many NULLs or multiple joined tables — both create complexity and slow down queries. MongoDB lets each document carry only the fields it needs.

#### Collections

**notifications**
```json
{
  "_id": "ObjectId",
  "notificationId": "string (UUID)",
  "title": "string",
  "message": "string",
  "notification_type": "placement | result | event",
  "isRead": false,
  "studentId": "string",
  "createdAt": "ISODate",
  "metadata": {
    "company": "optional",
    "salary": "optional",
    "semester": "optional"
  }
}
```

**users**
```json
{
  "_id": "ObjectId",
  "rollNo": "string",
  "email": "string",
  "name": "string"
}
```

#### Indexes

```js
// Composite index for the most common query
db.notifications.createIndex({ studentId: 1, isRead: 1, createdAt: -1 });

// Index for type-based filtering
db.notifications.createIndex({ notification_type: 1, createdAt: -1 });
```

#### Scaling Strategy

- **Sharding**: Shard by `studentId` so each shard handles a subset of students — queries never cross shards.
- **Replication**: MongoDB replica sets provide high availability. If the primary goes down, a secondary is auto-promoted.
- **Caching**: Frequently-read notification lists cached in Redis with a TTL of 60 seconds.
- **TTL Index**: Automatically expire old read notifications after 90 days.

```js
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

---

## Stage 3 – SQL Query Optimization

### Original Query
```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt;
```

### Problems
1. `SELECT *` — fetches all columns including large metadata fields; wastes bandwidth and memory.
2. No `LIMIT` — returns the entire unread set which could be thousands of rows.
3. No composite index — full table scan on every request.
4. `ORDER BY createdAt` without `DESC` — newest notifications should come first.

### Optimized Query
```sql
SELECT notificationId, title, message, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC
LIMIT 50;
```

### Recommended Index
```sql
CREATE INDEX idx_notifications_student_read_date
ON notifications (studentID, isRead, createdAt DESC);
```
This composite index satisfies the `WHERE` clause and `ORDER BY` in a single index scan — no sort step needed.

### Bonus: Students receiving placement notifications in the last 7 days
```sql
SELECT s.studentID, s.name, s.email, n.title, n.createdAt
FROM students s
JOIN notifications n ON s.studentID = n.studentID
WHERE n.notification_type = 'placement'
  AND n.createdAt >= NOW() - INTERVAL 7 DAY
ORDER BY n.createdAt DESC;
```

---

## Stage 4 – Performance Improvements

### Problem
Every page refresh hits the database, causing repeated identical queries, high latency, and unnecessary load.

### Solutions

#### 1. Server-Side Caching with Redis
```
Request → Check Redis cache
         Hit  → Return cached data (< 5ms)
         Miss → Query DB → Store in Redis (TTL 60s) → Return
```
Notifications don't change every second — a 60-second cache drastically reduces DB load.

#### 2. Pagination
Always use `page` and `limit` parameters. Never return the full collection. This keeps payloads small and renders fast.

#### 3. API Response Cache Headers
```
Cache-Control: public, max-age=30
ETag: "abc123hash"
```
The browser reuses cached responses until they expire, avoiding redundant network requests.

#### 4. Lazy Loading / Infinite Scroll
Instead of loading all pages upfront, load the next page only when the user scrolls near the bottom. Reduces initial load time significantly.

#### 5. Browser-Level Caching
Store the last fetched page in `localStorage` or React state so navigating back doesn't re-fetch.

#### 6. Database Query Optimization
Composite indexes (as defined in Stage 3) ensure queries are resolved via index scan, not full table scan.

### Tradeoffs
| Technique     | Benefit                  | Tradeoff                         |
|---------------|--------------------------|----------------------------------|
| Redis Cache   | Fast reads               | Stale data for up to TTL seconds |
| Pagination    | Small payloads           | Requires client-side state       |
| Lazy Loading  | Fast initial render      | Requires scroll event handling   |
| Cache Headers | Fewer network requests   | Cache invalidation complexity    |

---

## Stage 5 – Queue-Based Notification Processing

### Problem with Current Approach
```
for each student:
  → send email        ← if this fails, everything stops
  → save to DB
  → push notification
```
One failure breaks the entire chain. No retry. No recovery.

### Solution: Message Queue Architecture

#### Recommended Tools
- **BullMQ** (Node.js, Redis-backed) — simplest to integrate with existing stack
- **RabbitMQ** — production-grade, supports complex routing
- **Kafka** — for very high throughput (10k+ events/sec)

#### Flow
```
Admin triggers notification
        ↓
  Publish to Queue (BullMQ/RabbitMQ)
        ↓
   Queue Workers (3–5 parallel workers)
     ├── Email Worker    → sends email, retries on failure
     ├── DB Worker       → saves notification to MongoDB
     └── Push Worker     → sends push notification
```

#### Key Concepts

**Retry Logic**: Each worker retries failed jobs up to 3 times with exponential backoff.

**Dead Letter Queue (DLQ)**: Jobs that fail all retries are moved to a DLQ for manual inspection — no data loss.

**Idempotency**: Each notification has a unique `notificationId`. Workers check if the job was already processed before acting — prevents duplicate emails on retry.

**Background Workers**: Workers run as separate processes, so the main API server remains responsive.

#### BullMQ Example
```js
import { Queue, Worker } from "bullmq";

const notifQueue = new Queue("notifications");

// Producer
await notifQueue.add("send", { notificationId, studentIds, message });

// Consumer
new Worker("notifications", async (job) => {
  await sendEmail(job.data);
  await saveToDb(job.data);
  await sendPush(job.data);
}, { connection: redisConnection });
```
