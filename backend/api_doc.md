# API Documentation

## Authentication APIs

### Request OTP
- **Endpoint**: `POST /api/auth/request_otp/`
- **Auth**: None (Public)
- **Purpose**: Request OTP for login or registration
- **Body**: `{ "email": "string", "purpose": "string (login/registration)" }`

### Verify OTP
- **Endpoint**: `POST /api/auth/verify_otp/`
- **Auth**: None (Public)
- **Purpose**: Verify OTP and get JWT tokens (login) or create access request (registration)
- **Body**: `{ "email": "string", "otp": "string", "purpose": "string (login/registration)" }`

## User APIs

### List Users
- **Endpoint**: `GET /api/users/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: List all users in the same organization

### Create User
- **Endpoint**: `POST /api/users/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Create a new user in the same organization
- **Body**: `{ "email": "string", "first_name": "string", "last_name": "string" }`

### Update User
- **Endpoint**: `PUT/PATCH /api/users/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Update user details in the same organization
- **Body**: `{ "email": "string", "first_name": "string", "last_name": "string" }`

### Delete User
- **Endpoint**: `DELETE /api/users/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Delete a user in the same organization

### Get Current User
- **Endpoint**: `GET /api/users/me/`
- **Auth**: JWT Token (Bearer)
- **Access**: Any Authenticated User
- **Purpose**: Get current user's profile

### Revoke User Access
- **Endpoint**: `POST /api/users/{id}/revoke/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Revoke a user's access to the platform

### Restore User Access
- **Endpoint**: `POST /api/users/{id}/restore/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Restore a user's access to the platform

## Course APIs

### List Courses
- **Endpoint**: `GET /api/courses/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Members
- **Purpose**: List all courses in the same organization

### Create Course
- **Endpoint**: `POST /api/courses/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Create a new course in the same organization
- **Body**: `{ "title": "string", "description": "string", "thumbnail_url": "string (optional)", "status": "string (DRAFT/PUBLISHED/ARCHIVED)" }`

### Update Course
- **Endpoint**: `PUT/PATCH /api/courses/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Update course details in the same organization
- **Body**: `{ "title": "string", "description": "string", "thumbnail_url": "string (optional)", "status": "string (DRAFT/PUBLISHED/ARCHIVED)" }`

### Delete Course
- **Endpoint**: `DELETE /api/courses/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Delete a course in the same organization

## Module APIs

### List Modules
- **Endpoint**: `GET /api/courses/{course_id}/modules/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Members
- **Purpose**: List modules for a course in the same organization

### Create Module
- **Endpoint**: `POST /api/courses/{course_id}/modules/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Create a new module in a course
- **Body**: `{ "title": "string", "description": "string", "order": "integer (optional)" }`

### Update Module
- **Endpoint**: `PUT/PATCH /api/courses/{course_id}/modules/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Update module details in a course
- **Body**: `{ "title": "string", "description": "string", "order": "integer" }`

### Delete Module
- **Endpoint**: `DELETE /api/courses/{course_id}/modules/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Delete a module from a course

## Lesson APIs

### List Lessons
- **Endpoint**: `GET /api/courses/{course_id}/lessons/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Members
- **Purpose**: List lessons for a course in the same organization

### Create Lesson
- **Endpoint**: `POST /api/courses/{course_id}/lessons/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Create a new lesson in a course
- **Body**: `{ "title": "string", "description": "string", "content_type": "string (VIDEO/TEXT/INTERACTIVE)", "content": "object", "order": "integer (optional)", "module_id": "UUID" }`

### Update Lesson
- **Endpoint**: `PUT/PATCH /api/courses/{course_id}/lessons/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Update lesson details in a course
- **Body**: `{ "title": "string", "description": "string", "content_type": "string (VIDEO/TEXT/INTERACTIVE)", "content": "object", "order": "integer" }`

### Delete Lesson
- **Endpoint**: `DELETE /api/courses/{course_id}/lessons/{id}/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Delete a lesson from a course

## Access Request APIs

### List Access Requests
- **Endpoint**: `GET /api/access_requests/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: List all access requests for the organization

### Create Access Request
- **Endpoint**: `POST /api/access_requests/`
- **Auth**: None (Public)
- **Purpose**: Create a new access request
- **Body**: `{ "email": "string" }`

### Approve Access Request
- **Endpoint**: `POST /api/access_requests/{id}/approve/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Approve an access request and create user

### Reject Access Request
- **Endpoint**: `POST /api/access_requests/{id}/reject/`
- **Auth**: JWT Token (Bearer)
- **Access**: Organization Admins
- **Purpose**: Reject an access request

## Authentication Details

- All authenticated endpoints require a JWT token in the Authorization header: `Authorization: Bearer <token>`
- JWT tokens are obtained through the OTP verification process
- Access levels:
  - Public: No authentication required
  - Any Authenticated User: Must have a valid JWT token (no organization membership required)
  - Organization Members: Must be authenticated and belong to an organization (`user.organization` must not be null)
  - Organization Admins: Must be authenticated, belong to the organization, and have admin privileges (`is_staff=True` or `is_superuser=True`)
- Organization-based access control ensures users can only access resources within their organization 