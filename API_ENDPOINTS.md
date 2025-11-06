# API Endpoints Documentation

Base URL: `/api`

## 📚 Exam Endpoints

### List Exams
- **GET** `/api/exam`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of exams with optional status filtering

### Create Exam
- **POST** `/api/exam`
  - Body: `{ name: string, status?: string, orderNumber?: number }`
  - Description: Create a new exam

### Get Single Exam
- **GET** `/api/exam/[id]`
  - Description: Get a single exam by ID

### Update Exam
- **PUT** `/api/exam/[id]`
  - Body: `{ name: string, status?: string, content?: string, title?: string, metaDescription?: string, keywords?: string, orderNumber?: number }`
  - Description: Update exam details

### Update Exam Status/Order (Partial)
- **PATCH** `/api/exam/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update exam status and/or orderNumber with cascading to all children

### Delete Exam
- **DELETE** `/api/exam/[id]`
  - Description: Delete an exam

---

## 📖 Subject Endpoints

### List Subjects
- **GET** `/api/subject`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `examId` (optional): Filter by exam ID
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of subjects with optional filtering

### Create Subject
- **POST** `/api/subject`
  - Body: `{ name: string, examId: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Create a new subject

### Get Single Subject
- **GET** `/api/subject/[id]`
  - Description: Get a single subject by ID with populated exam data

### Update Subject
- **PUT** `/api/subject/[id]`
  - Body: `{ name: string, examId?: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Update subject details

### Update Subject Status/Order (Partial)
- **PATCH** `/api/subject/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update subject status and/or orderNumber

### Update Subject Status with Cascading
- **PATCH** `/api/subject/[id]/status`
  - Body: `{ status: string }` (must be `active` or `inactive`)
  - Description: Update subject status with cascading to all children (units, chapters, topics, subtopics)

### Delete Subject
- **DELETE** `/api/subject/[id]`
  - Description: Delete a subject

---

## 📚 Unit Endpoints

### List Units
- **GET** `/api/unit`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `subjectId` (optional): Filter by subject ID
    - `examId` (optional): Filter by exam ID
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of units with optional filtering

### Create Unit
- **POST** `/api/unit`
  - Body: `{ name: string, subjectId: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Create a new unit

### Get Single Unit
- **GET** `/api/unit/[id]`
  - Description: Get a single unit by ID with populated subject and exam data

### Update Unit
- **PUT** `/api/unit/[id]`
  - Body: `{ name: string, subjectId?: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Update unit details

### Update Unit Status/Order (Partial)
- **PATCH** `/api/unit/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update unit status and/or orderNumber

### Reorder Units
- **PATCH** `/api/unit/reorder`
  - Body: `{ units: Array<{ id: string, orderNumber: number }> }`
  - Description: Reorder multiple units at once

### Update Unit Status with Cascading
- **PATCH** `/api/unit/[id]/status`
  - Body: `{ status: string }` (must be `active` or `inactive`)
  - Description: Update unit status with cascading to all children (chapters, topics, subtopics)

### Delete Unit
- **DELETE** `/api/unit/[id]`
  - Description: Delete a unit

---

## 📑 Chapter Endpoints

### List Chapters
- **GET** `/api/chapter`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `unitId` (optional): Filter by unit ID
    - `subjectId` (optional): Filter by subject ID
    - `examId` (optional): Filter by exam ID
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of chapters with optional filtering

### Create Chapter
- **POST** `/api/chapter`
  - Body: `{ name: string, unitId: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Create a new chapter

### Get Single Chapter
- **GET** `/api/chapter/[id]`
  - Description: Get a single chapter by ID with populated unit, subject, and exam data

### Update Chapter
- **PUT** `/api/chapter/[id]`
  - Body: `{ name: string, unitId?: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Update chapter details

### Update Chapter Status/Order (Partial)
- **PATCH** `/api/chapter/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update chapter status and/or orderNumber

### Reorder Chapters
- **POST** or **PATCH** `/api/chapter/reorder`
  - Body: `{ chapters: Array<{ id: string, orderNumber: number }> }`
  - Description: Reorder multiple chapters at once

### Update Chapter Status with Cascading
- **PATCH** `/api/chapter/[id]/status`
  - Body: `{ status: string }` (must be `active` or `inactive`)
  - Description: Update chapter status with cascading to all children (topics, subtopics)

### Delete Chapter
- **DELETE** `/api/chapter/[id]`
  - Description: Delete a chapter

---

## 📝 Topic Endpoints

### List Topics
- **GET** `/api/topic`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `chapterId` (optional): Filter by chapter ID
    - `unitId` (optional): Filter by unit ID
    - `subjectId` (optional): Filter by subject ID
    - `examId` (optional): Filter by exam ID
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of topics with optional filtering

### Create Topic
- **POST** `/api/topic`
  - Body: `{ name: string, chapterId: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Create a new topic

### Get Single Topic
- **GET** `/api/topic/[id]`
  - Description: Get a single topic by ID with populated chapter, unit, subject, and exam data

### Update Topic
- **PUT** `/api/topic/[id]`
  - Body: `{ name: string, chapterId?: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Update topic details

### Update Topic Status/Order (Partial)
- **PATCH** `/api/topic/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update topic status and/or orderNumber

### Reorder Topics
- **PATCH** `/api/topic/reorder`
  - Body: `{ topics: Array<{ id: string, orderNumber: number }> }`
  - Description: Reorder multiple topics at once

### Update Topic Status with Cascading
- **PATCH** `/api/topic/[id]/status`
  - Body: `{ status: string }` (must be `active` or `inactive`)
  - Description: Update topic status with cascading to all children (subtopics)

### Delete Topic
- **DELETE** `/api/topic/[id]`
  - Description: Delete a topic

---

## 📄 SubTopic Endpoints

### List SubTopics
- **GET** `/api/subtopic`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `topicId` (optional): Filter by topic ID
    - `chapterId` (optional): Filter by chapter ID
    - `unitId` (optional): Filter by unit ID
    - `subjectId` (optional): Filter by subject ID
    - `examId` (optional): Filter by exam ID
    - `status` (optional): Filter by status (`active`, `inactive`, `all`) (default: `active`)
  - Description: Get paginated list of subtopics with optional filtering

### Create SubTopic
- **POST** `/api/subtopic`
  - Body: `{ name: string, topicId: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Create a new subtopic

### Get Single SubTopic
- **GET** `/api/subtopic/[id]`
  - Description: Get a single subtopic by ID with populated topic, chapter, unit, subject, and exam data

### Update SubTopic
- **PUT** `/api/subtopic/[id]`
  - Body: `{ name: string, topicId?: string, status?: string, orderNumber?: number, content?: string, title?: string, metaDescription?: string, keywords?: string }`
  - Description: Update subtopic details

### Update SubTopic Status/Order (Partial)
- **PATCH** `/api/subtopic/[id]`
  - Body: `{ status?: string, orderNumber?: number }`
  - Description: Update subtopic status and/or orderNumber

### Reorder SubTopics
- **PATCH** `/api/subtopic/reorder`
  - Body: `{ subtopics: Array<{ id: string, orderNumber: number }> }`
  - Description: Reorder multiple subtopics at once

### Update SubTopic Status
- **PATCH** `/api/subtopic/[id]/status`
  - Body: `{ status: string }` (must be `active` or `inactive`)
  - Description: Update subtopic status (no cascading as subtopics are leaf nodes)

### Delete SubTopic
- **DELETE** `/api/subtopic/[id]`
  - Description: Delete a subtopic

---

## 📋 Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Status Filtering
- `status`: Filter by status
  - `active`: Only active items
  - `inactive`: Only inactive items
  - `all`: All items regardless of status

### Hierarchical Filtering
- `examId`: Filter by exam ID
- `subjectId`: Filter by subject ID
- `unitId`: Filter by unit ID
- `chapterId`: Filter by chapter ID
- `topicId`: Filter by topic ID

---

## 📝 Response Format

All endpoints follow a consistent response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

---

## 🔄 Cascading Status Updates

When updating status on parent items, the change cascades to all children:

- **Exam** → Updates all Subjects, Units, Chapters, Topics, and SubTopics
- **Subject** → Updates all Units, Chapters, Topics, and SubTopics
- **Unit** → Updates all Chapters, Topics, and SubTopics
- **Chapter** → Updates all Topics and SubTopics
- **Topic** → Updates all SubTopics
- **SubTopic** → No cascading (leaf node)

---

## 📊 Notes

1. All ID parameters must be valid MongoDB ObjectIds
2. Status values must be either `"active"` or `"inactive"` (case-insensitive)
3. Pagination is available on all list endpoints
4. Hierarchical filtering allows filtering by any parent level
5. Reorder endpoints accept arrays of items with `id` and `orderNumber` properties
6. Cache is implemented for active status queries (5-minute TTL)

