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

| Feature | Status | Notes |
|---------|--------|-------|
| User email/password registration | ✅ DONE | `/api/v1/auth/register/user` |
| User login | ✅ DONE | `/api/v1/auth/login/user` |
| Therapist registration | ✅ DONE | `/api/v1/auth/register/therapist` |
| Therapist login | ✅ DONE | `/api/v1/auth/login/therapist` |
| Admin login | ✅ DONE | `/api/v1/auth/login/admin` |
| Phone/OTP registration | ❌ BLOCKED | Requires SMS provider (Twilio, etc.) |
| Token refresh | ✅ DONE | `/api/v1/auth/refresh` |
| Logout | ✅ DONE | `/api/v1/auth/logout` |
| Password change | ✅ DONE | `/api/v1/auth/change-password` |

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
| Therapist onboarding | ✅ DONE | Registration exists |
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
| Dashboard stats | ⏳ PENDING | |
| Therapist approval/rejection | ✅ DONE | |
| View all users | ⏳ PENDING | |
| View all therapists | ⏳ PENDING | |
| View all bookings | ⏳ PENDING | |
| Payout reports | ⏳ PENDING | |
| Audit logs | ⏳ PENDING | Schema exists |

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

---

## Priority Tasks Remaining (No Third-Party Required)

1. ⏳ Admin dashboard with statistics
2. ⏳ Admin view all users/therapists/bookings
3. ⏳ Payout tracking and reports
4. ⏳ Conversation/messaging basic CRUD
5. ⏳ In-app notification system
6. ⏳ Session creation from booking
7. ⏳ Therapist document management

---

## Blocked Tasks (Require Third-Party Services)

| Feature | Required Service |
|---------|------------------|
| Phone/OTP authentication | SMS Provider (Twilio, etc.) |
| Video/Audio sessions | WebRTC Provider (Daily.co, Twilio, Agora) |
| Payment processing | Payment Gateway (Stripe, FuratPay) |
| Push notifications | Firebase FCM |
| Email notifications | Email Provider (SendGrid, SES) |
| Real-time messaging | WebSocket Server |
| Session reminders | Cron Job Service |

---

*Last updated: January 16, 2026*
