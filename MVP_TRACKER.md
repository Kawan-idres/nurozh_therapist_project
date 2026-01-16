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
| Therapist creation | ✅ DONE | **Admin only** - `/api/v1/auth/register/therapist` |
| User login | ✅ DONE | `/api/v1/auth/login/user` |
| Therapist login | ✅ DONE | `/api/v1/auth/login/therapist` (requires approved status) |
| Admin login | ✅ DONE | `/api/v1/auth/login/admin` |
| Phone/OTP registration | ❌ BLOCKED | Requires SMS provider (Twilio, etc.) |

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
| Therapist onboarding | ✅ DONE | Admin creates therapist (auto-approved) |
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
| Message clients | ⏳ PENDING | Schema exists |
| Start video/audio session | ❌ BLOCKED | Requires WebRTC/Daily.co |
| View payout summaries | ⏳ PENDING | Schema exists |

---

## 4. Booking & Scheduling

| Feature | Status | Notes |
|---------|--------|-------|
| Therapist availability CRUD | ✅ DONE | Full implementation |
| Availability exceptions | ✅ DONE | Day off / special hours |
| Create booking | ✅ DONE | Auto-detects free session |
| Booking status: pending | ✅ DONE | Default on creation |
| Booking status: confirmed (accept) | ✅ DONE | Therapist confirms |
| Booking status: rescheduled | ✅ DONE | Either party can reschedule |
| Booking status: cancelled | ✅ DONE | With reason tracking |
| Booking status: completed | ✅ DONE | With therapist notes |
| Free session logic | ✅ DONE | 30 min, marks `free_session_used` on confirm |

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
| Create conversation | ⏳ PENDING | |
| Send message | ⏳ PENDING | |
| List messages | ⏳ PENDING | |
| Mark as read | ⏳ PENDING | |
| Real-time messaging | ❌ BLOCKED | Requires WebSocket |

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

---

## Priority Tasks Remaining (No Third-Party Required)

1. ✅ ~~Admin dashboard with statistics~~ - DONE
2. ✅ ~~Admin view all users/therapists/bookings~~ - DONE
3. ⏳ Payout tracking and reports
4. ⏳ Conversation/messaging basic CRUD
5. ⏳ In-app notification system
6. ⏳ Session creation from booking
7. ⏳ Therapist document management
8. ⏳ Login rate limiting (security enhancement)

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
| Real-time messaging | WebSocket Server |
| Session reminders | Cron Job Service |

---

*Last updated: January 16, 2026*
