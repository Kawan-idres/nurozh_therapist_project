# Nurozh MVP Implementation Tracker

## Overview
This file tracks the implementation progress of MVP features based on the specification document.

---

## Status Legend
- ✅ **DONE** - Fully implemented and tested
- 🔄 **IN PROGRESS** - Currently being worked on
- ⏳ **PENDING** - Not yet started
- ❌ **BLOCKED** - Requires third-party service integration

---

## 1. Authentication Module

### 1.1 Registration & Login

| Feature | Status | Notes |
|---------|--------|-------|
| User email/password registration | ✅ DONE | Public - `/api/v1/auth/register/user` |
| Therapist creation | ✅ DONE | **Admin only** - `/api/v1/auth/register/therapist` (with specialty assignment) |
| User login | ✅ DONE | `/api/v1/auth/login/user` |
| Therapist login | ✅ DONE | `/api/v1/auth/login/therapist` (requires approved status) |
| Admin login | ✅ DONE | `/api/v1/auth/login/admin` |
| Phone/OTP registration | ❌ BLOCKED | Requires SMS provider (Twilio, etc.) |
| Phone uniqueness | ✅ DONE | Unique constraint on phone field for both User and Therapist |

### 1.2 Token Management (Works for ALL user types)

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Access Token | ✅ DONE | 15 min expiry, contains: id, email, type, role |
| JWT Refresh Token | ✅ DONE | 7 days expiry, stored in DB |
| Token refresh | ✅ DONE | `/api/v1/auth/refresh` - get new tokens |
| Logout | ✅ DONE | `/api/v1/auth/logout` - revokes refresh token |
| Logout all devices | ✅ DONE | `/api/v1/auth/logout-all` - revokes ALL tokens |

### 1.3 Password & Profile (Works for ALL user types)

| Feature | Status | Notes |
|---------|--------|-------|
| Change password | ✅ DONE | `/api/v1/auth/change-password` - also revokes all tokens |
| Get current profile | ✅ DONE | `/api/v1/auth/me` - returns user based on token type |
| Password hashing | ✅ DONE | bcrypt with 12 salt rounds |
| Forgot password | ❌ BLOCKED | Requires email service |
| Email verification | ❌ BLOCKED | Requires email service |

### 1.4 Security Features

| Feature | Status | Notes |
|---------|--------|-------|
| Therapist approval check | ✅ DONE | Therapists can't login until approved |
| User active status check | ✅ DONE | Inactive/deleted users blocked |
| Admin active status check | ✅ DONE | Inactive admins blocked |
| Login rate limiting | ⏳ PENDING | Could add to prevent brute force |
| Account lockout | ⏳ PENDING | Could add after X failed attempts |

### 1.5 Access Control

| Endpoint | Who Can Access |
|----------|----------------|
| `POST /register/user` | Public |
| `POST /register/therapist` | Admin only (requires `therapists:create` permission) |
| `POST /login/*` | Public |
| `POST /refresh` | Anyone with valid refresh token |
| `POST /logout` | Authenticated users |
| `POST /logout-all` | Authenticated users |
| `POST /change-password` | Authenticated users |
| `GET /me` | Authenticated users |

---

## 2. User Flow

| Feature | Status | Notes |
|---------|--------|-------|
| User profile management | ✅ DONE | Basic CRUD |
| Questionnaire completion | ✅ DONE | `/api/v1/questionnaires/answers` |
| View own questionnaire answers | ✅ DONE | `/api/v1/questionnaires/my-answers` |
| View therapist list with filters | ✅ DONE | Filters: specialty, language, price, experience, gender |
| Select therapist manually | ✅ DONE | Via booking creation |
| Free first session (30 min) | ✅ DONE | Auto-detected on booking creation |
| Book session | ✅ DONE | `/api/v1/bookings` POST |
| View booking history | ✅ DONE | `/api/v1/bookings` GET with status filter |
| Accept rescheduled booking | ✅ DONE | `/api/v1/bookings/:id/accept-reschedule` |

---

## 3. Therapist Flow

| Feature | Status | Notes |
|---------|--------|-------|
| Therapist onboarding | ✅ DONE | Admin creates therapist (auto-approved, with specialties) |
| Specialty assignment | ✅ DONE | Via registration or `PUT /api/v1/therapists/:id/specialties` |
| Document upload | ⏳ PENDING | Schema exists, needs file upload integration |
| Admin approval workflow | ✅ DONE | `/api/v1/therapists/:id/approve` |
| Set weekly availability | ✅ DONE | `/api/v1/therapists/me/availability` PUT |
| Add availability exceptions | ✅ DONE | `/api/v1/therapists/me/availability/exception` POST |
| View client list | ✅ DONE | `/api/v1/therapists/me/clients` |
| View questionnaire answers | ✅ DONE | `/api/v1/questionnaires/answers/user/:userId` |
| Accept booking | ✅ DONE | `/api/v1/bookings/:id/confirm` |
| Reschedule booking | ✅ DONE | `/api/v1/bookings/:id/reschedule` |
| Cancel booking | ✅ DONE | `/api/v1/bookings/:id/cancel` |
| Complete booking | ✅ DONE | `/api/v1/bookings/:id/complete` |
| Message clients | ✅ DONE | Full messaging with authorization, read receipts |
| Start video/audio session | ❌ BLOCKED | Requires WebRTC/Daily.co |
| View payout summaries | ⏳ PENDING | Schema exists |

---

## 4. Booking & Scheduling

| Feature | Status | Notes |
|---------|--------|-------|
| Therapist availability CRUD | ✅ DONE | Full implementation |
| Availability exceptions | ✅ DONE | Day off / special hours |
| Create booking | ✅ DONE | Auto-detects free session, validates session_type, date in future, therapist approved |
| Scheduling conflict detection | ✅ DONE | Prevents double-booking |
| Booking status: pending | ✅ DONE | Default on creation |
| Booking status: confirmed (accept) | ✅ DONE | Therapist confirms |
| Booking status: rescheduled | ✅ DONE | Either party can reschedule, tracks `rescheduled_by` |
| Booking status: cancelled | ✅ DONE | With reason tracking, restores free session if applicable |
| Booking status: completed | ✅ DONE | With therapist notes and `completed_at` timestamp |
| Booking status: no_show | ✅ DONE | `/api/v1/bookings/:id/no-show` - free session NOT restored |
| Free session logic | ✅ DONE | 30 min, marks `free_session_used` on confirm |
| Reschedule acceptance | ✅ DONE | Other party must accept via `/accept-reschedule` |

---

## 5. Sessions

| Feature | Status | Notes |
|---------|--------|-------|
| Session types (video/audio/chat) | ✅ DONE | Schema supports all types |
| Create session from booking | ⏳ PENDING | |
| Start session | ⏳ PENDING | |
| End session | ⏳ PENDING | |
| Session duration tracking | ⏳ PENDING | |
| Video/Audio integration | ❌ BLOCKED | Requires WebRTC provider |

---

## 6. Payments & Subscriptions

| Feature | Status | Notes |
|---------|--------|-------|
| Payment schema | ✅ DONE | |
| Per-session payment | ❌ BLOCKED | Requires payment provider |
| Weekly subscription | ❌ BLOCKED | Requires payment provider |
| Monthly subscription | ❌ BLOCKED | Requires payment provider |
| Payment receipts | ⏳ PENDING | Can implement logic |
| Session/payment history | ⏳ PENDING | |
| Therapist payouts | ⏳ PENDING | Admin view |

---

## 7. Messaging

| Feature | Status | Notes |
|---------|--------|-------|
| Conversation schema | ✅ DONE | |
| Create conversation | ✅ DONE | `POST /api/v1/conversations` - requires booking relationship |
| Get conversations | ✅ DONE | `GET /api/v1/conversations` - with unread count, last message |
| Get single conversation | ✅ DONE | `GET /api/v1/conversations/:id` |
| Send message | ✅ DONE | `POST /api/v1/conversations/:id/messages` - with validation |
| List messages | ✅ DONE | `GET /api/v1/conversations/:id/messages` - with sender details |
| Mark as read | ✅ DONE | `PATCH /api/v1/conversations/:id/read` |
| Get unread count | ✅ DONE | `GET /api/v1/conversations/unread-count` |
| Delete own message | ✅ DONE | `DELETE /api/v1/conversations/:id/messages/:messageId` (soft delete) |
| Authorization checks | ✅ DONE | Admins blocked, participants only, booking required |
| Real-time messaging (Socket.IO) | ✅ DONE | WebSocket with JWT auth, typing indicators, read receipts |

---

## 8. Notifications

| Feature | Status | Notes |
|---------|--------|-------|
| Notification schema | ✅ DONE | |
| Notification templates | ✅ DONE | |
| In-app notifications | ⏳ PENDING | Can implement |
| Push notifications | ❌ BLOCKED | Requires Firebase FCM |
| Email notifications | ❌ BLOCKED | Requires email provider |
| Session reminders (24h, 1h, 10m) | ❌ BLOCKED | Requires cron + notification service |

---

## 9. Admin Panel

| Feature | Status | Notes |
|---------|--------|-------|
| Admin login | ✅ DONE | `/api/v1/auth/login/admin` |
| Create therapists | ✅ DONE | `/api/v1/auth/register/therapist` (admin only) |
| Dashboard stats | ✅ DONE | `/api/v1/admin/dashboard` - comprehensive stats |
| Therapist approval/rejection | ✅ DONE | `/api/v1/therapists/:id/approve` |
| View all users | ✅ DONE | `/api/v1/admin/users` with filters |
| View user details | ✅ DONE | `/api/v1/admin/users/:id` |
| View all therapists | ✅ DONE | `/api/v1/admin/therapists` with filters |
| View therapist details | ✅ DONE | `/api/v1/admin/therapists/:id` |
| View all bookings | ✅ DONE | `/api/v1/admin/bookings` with filters |
| View booking details | ✅ DONE | `/api/v1/admin/bookings/:id` |
| Payout reports | ⏳ PENDING | |
| Audit logs | ✅ DONE | `/api/v1/admin/audit-logs` |

---

## 10. API Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Swagger/OpenAPI documentation | ✅ DONE | Full docs for all modules |
| Specialties Swagger docs | ✅ DONE | Complete schema and examples |
| Questionnaires Swagger docs | ✅ DONE | Includes QuestionnaireCategory, Question, QuestionOption, QuestionnaireAnswer schemas |
| Bookings Swagger docs | ✅ DONE | Complete ~1100 lines with all endpoints documented |
| Error handling middleware | ✅ DONE | User-friendly messages, hides stack traces |
| Prisma error mapping | ✅ DONE | Maps Prisma error codes to readable messages |
| Request validation | ✅ DONE | Joi schemas for input validation |
| Request ID tracking | ✅ DONE | All errors include requestId for debugging |

---

## Implementation Log

### January 16, 2026
- Created MVP_TRACKER.md
- Migrated database from PostgreSQL to MySQL
- Updated DOCUMENTATION.md for MySQL
- **Verified admin login** - Already fully implemented
- **Added FREE_SESSION_CONFIG** - 30 minutes for free sessions
- **Enhanced booking routes:**
  - Added `/reschedule` endpoint
  - Added `/accept-reschedule` endpoint
  - Added `/complete` endpoint
  - Added free session auto-detection logic
  - Added proper authorization checks
  - Free session marks `free_session_used` on confirm
- **Enhanced therapist routes:**
  - Added filters: specialty_id, language, min_price, max_price, min_experience, gender, search
  - Added `/me/availability` PUT for therapists to set schedule
  - Added `/me/availability/exception` POST for day offs
  - Added `/me/clients` GET for therapist's client list
  - Added `/:id/availability` GET with exceptions
- **Enhanced questionnaire routes:**
  - Added `/answers/user/:userId` GET for therapists to view client answers
  - Added `/my-answers` GET for users to view own answers
- **Secured therapist registration:**
  - Changed from public to admin-only
  - Added `therapists:create` permission requirement
  - Admin-created therapists are auto-approved
  - Tracks `created_by` and `approved_by` admin ID

- **Enhanced admin panel:**
  - Added comprehensive `/dashboard` endpoint with:
    - User stats: total, active, newToday, newThisWeek, newThisMonth
    - Therapist stats: total, approved, pending, rejected
    - Booking stats: total, pending, confirmed, completed, cancelled, today
    - Session stats: total, completed
    - Revenue stats: total, thisMonth
  - Added `/users` GET with pagination and filters (status, search)
  - Added `/users/:id` GET with booking history
  - Added `/therapists` GET with pagination and filters (status, search)
  - Added `/therapists/:id` GET with full details (specialties, documents, availability)
  - Added `/bookings` GET with filters (status, therapist_id, user_id, from_date, to_date)
  - Added `/bookings/:id` GET with user, therapist, session, payment details

### January 16, 2026 (Session 2)

- **Phone uniqueness constraint:**
  - Added `@unique` to phone field in User and Therapist models
  - Cleared duplicate phone numbers in database
  - Pushed schema migration

- **Specialty assignment for therapists:**
  - Updated `registerTherapist` in auth.service.js to accept `specialty_ids`
  - Added validation schema for `specialty_ids` in auth.schema.js
  - Added `PUT /api/v1/therapists/:id/specialties` endpoint for admin
  - Updated Swagger documentation for therapist registration

- **Swagger documentation updates:**
  - Added complete Swagger docs for specialty.routes.js (Specialty schema, all CRUD endpoints)
  - Added complete Swagger docs for questionnaire.routes.js (QuestionnaireCategory, Question, QuestionOption, QuestionnaireAnswer schemas)
  - Complete rewrite of booking.routes.js Swagger docs (~1100 lines)

- **Error handling improvements:**
  - Added Prisma error code mapping to user-friendly messages
  - Removed stack traces from API responses
  - Handle PrismaClientKnownRequestError and PrismaClientValidationError
  - All errors now return clean, user-friendly messages

- **Questionnaire endpoint fixes:**
  - Fixed POST `/answers` - only users (not admins) can submit
  - Added validation to check question_ids exist before saving
  - Fixed GET `/answers/user/:userId` - parsed userId as integer
  - Enhanced GET `/my-answers` to include selected_options details

- **Complete bookings module rewrite:**
  - Full authorization checks (user owns booking, therapist assigned, admin access)
  - Input validations: date in future, valid session_type, therapist approved
  - Scheduling conflict detection (prevents double-booking)
  - Free session handling and restoration on cancel
  - Added `rescheduled_by` field to track who requested reschedule
  - Added `completed_at` timestamp field
  - New POST `/no-show` endpoint (free session NOT restored)
  - User/therapist details included in responses

- **Database schema updates:**
  - Added `rescheduled_by` field to Booking model (USER/THERAPIST enum)
  - Added `completed_at` DateTime field to Booking model
  - Regenerated Prisma client

### January 18, 2026

- **Complete Messaging System Implementation:**
  - Created `conversation.helpers.js` with authorization functions:
    - `checkConversationAccess()` - Verifies user is participant, blocks admins
    - `checkTherapistRelationship()` - Checks booking exists between user/therapist
    - `getUnreadCount()` - Calculates unread messages per conversation
    - `getLastMessage()` - Gets most recent message preview
    - `formatConversationResponse()` - Formats with participant details, unread count
    - `getSenderDetails()` - Gets sender info for messages
  - Created `conversation.schema.js` with Zod validation schemas:
    - `createConversationSchema` - Validates therapist_id/user_id
    - `sendMessageSchema` - Validates content (1-5000 chars), message_type
    - `getMessagesSchema`, `getConversationSchema`, `markReadSchema`, `deleteMessageSchema`
  - **Fixed existing endpoints:**
    - `GET /conversations` - Blocks admins, includes user/therapist details, unread count, last message
    - `GET /conversations/:id/messages` - Added authorization, includes sender details
    - `POST /conversations/:id/messages` - Added authorization, validates content, blocks system message type
    - `POST /conversations` - Blocks admins, verifies booking relationship exists
  - **Added new endpoints:**
    - `GET /conversations/:id` - Get single conversation with full details
    - `PATCH /conversations/:id/read` - Mark conversation as read (updates user/therapist timestamp)
    - `GET /conversations/unread-count` - Get total unread and per-conversation breakdown
    - `DELETE /conversations/:id/messages/:messageId` - Soft delete own message
  - **Authorization rules implemented:**
    - Users can only message therapists they have bookings with
    - Therapists can only message users who have booked with them
    - Admins are blocked from ALL messaging endpoints (403 Forbidden)
  - Added complete Swagger documentation for all endpoints

### January 18, 2026 (Session 2)

- **Socket.IO Real-Time Messaging Implementation:**
  - Installed `socket.io` dependency
  - Created `src/socket/index.js`:
    - Socket.IO server initialization with CORS support
    - JWT authentication middleware (reuses existing `verifyAccessToken`)
    - Blocks admin users from connecting (same rule as REST API)
    - Verifies user is active in database before allowing connection
    - Auto-joins users to all their conversation rooms on connect
    - Logs connection/disconnection events
  - Created `src/socket/handlers/messageHandler.js`:
    - `join_conversation` - Join a specific conversation room (with access check)
    - `leave_conversation` - Leave a conversation room
    - `send_message` - Send message (saves to DB, emits to room participants)
    - `typing` - Broadcast typing indicator to other participants
    - `mark_read` - Mark messages as read, emit read receipt
  - Modified `server.js`:
    - Changed from `app.listen()` to HTTP server with `createServer(app)`
    - Initialized Socket.IO with the HTTP server
    - Added Socket.IO URL to startup logs
  - Integrated with REST API (`conversation.routes.js`):
    - POST message endpoint now emits `new_message` Socket.IO event
    - PATCH mark-as-read endpoint now emits `message_read` Socket.IO event
  - **Socket Events (Client → Server):**
    - `join_conversation` - Join room `conversation-{id}`
    - `leave_conversation` - Leave room
    - `send_message` - Save to DB, emit to room
    - `typing` - Broadcast typing indicator
    - `mark_read` - Update DB, emit read receipt
  - **Socket Events (Server → Client):**
    - `new_message` - Message received in conversation
    - `user_typing` - Someone is typing
    - `message_read` - Message marked as read
    - `error` - Something went wrong
    - `joined_conversation` / `left_conversation` - Confirmations
  - Created `test-socket.html` - Browser-based test client for testing Socket.IO
  - **Files created/modified:**
    - `package.json` - Added socket.io dependency
    - `server.js` - HTTP server + Socket.IO initialization
    - `src/socket/index.js` - Socket.IO setup with auth
    - `src/socket/handlers/messageHandler.js` - Event handlers
    - `src/modules/conversations/conversation.routes.js` - Emit events on REST calls
    - `test-socket.html` - Test client

---

## Priority Tasks Remaining (No Third-Party Required)

1. ✅ ~~Admin dashboard with statistics~~ - DONE
2. ✅ ~~Admin view all users/therapists/bookings~~ - DONE
3. ✅ ~~Conversation/messaging basic CRUD~~ - DONE
4. ✅ ~~Real-time messaging (Socket.IO)~~ - DONE
5. ⏳ Payout tracking and reports
6. ⏳ In-app notification system
7. ⏳ Session creation from booking
8. ⏳ Therapist document management
9. ⏳ Login rate limiting (security enhancement)

---

## Blocked Tasks (Require Third-Party Services)

| Feature | Required Service |
|---------|------------------|
| Phone/OTP authentication | SMS Provider (Twilio, etc.) |
| Forgot password / Reset | Email Provider (SendGrid, SES) |
| Email verification | Email Provider (SendGrid, SES) |
| Video/Audio sessions | WebRTC Provider (Daily.co, Twilio, Agora) |
| Payment processing | Payment Gateway (Stripe, FuratPay) |
| Push notifications | Firebase FCM |
| Session reminders | Cron Job Service |

---

*Last updated: January 18, 2026*
