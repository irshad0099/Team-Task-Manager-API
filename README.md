# Team Task Manager API

## Project Overview
A complete backend service for managing teams, members, and task boards with three columns: TODO → DOING → DONE.

## Features Implemented
✅ User Authentication (JWT)  
✅ Team Management (Create, Add/Remove Members)  
✅ Task Board with 3 Columns  
✅ Task Operations (CRUD, Move, Assign, Comment)  
✅ Pagination, Search & Filtering  
✅ Activity Logging with Background Jobs  
✅ Redis Caching with Invalidation  
✅ Rate Limiting for Sensitive Endpoints  
✅ Comprehensive Error Handling  
✅ API Documentation (Swagger)  
✅ Clean Folder Structure  
✅ Input Validation  

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis
- **Queue:** Bull (for background jobs)
- **Authentication:** JWT with bcryptjs
- **Documentation:** Swagger/OpenAPI
- **Validation:** express-validator

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Redis
- npm or yarn

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd team-task-manager