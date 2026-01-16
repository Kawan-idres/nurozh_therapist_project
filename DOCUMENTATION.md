# Nurozh Therapy Platform - Implementation Documentation

## Overview

This document details the transformation of a basic Express.js todo application into a complete therapy/mental health platform called "Nurozh".

---

## 1. Project Structure

The project was reorganized into a modular structure under the `src/` directory:

```
nurozh_therapist_project/
├── prisma/
│   ├── schema.prisma          # Database schema (27 tables)
│   └── migrations/            # Database migrations
├── src/
│   ├── config/
│   │   ├── constants.js       # Application constants & enums
│   │   ├── env.js             # Environment validation (Zod)
│   │   ├── logger.js          # Winston logger configuration
│   │   ├── prisma.js          # Prisma client instance
│   │   └── swagger.js         # Swagger/OpenAPI configuration
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── rbac.js            # Role-based access control
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── requestId.js       # Request tracking
│   │   ├── security.js        # Helmet & rate limiting
│   │   └── validate.js        # Zod validation middleware
│   ├── utils/
│   │   ├── errors.js          # Custom error classes
│   │   ├── helpers.js         # Utility functions
│   │   ├── jwt.js             # JWT token utilities
│   │   └── password.js        # Bcrypt password utilities
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── therapists/        # Therapist management
│   │   ├── admin/             # Admin dashboard & management
│   │   ├── bookings/          # Booking management
│   │   ├── sessions/          # Session management
│   │   ├── payments/          # Payment processing
│   │   ├── conversations/     # Messaging system
│   │   ├── questionnaires/    # Questionnaire system
│   │   ├── specialties/       # Therapy specialties
│   │   ├── subscriptions/     # Subscription management
│   │   └── uploads/           # File upload handling
│   ├── seeders/
│   │   └── seed.js            # Database seeder
│   ├── app.js                 # Express application setup
│   └── health.routes.js       # Health check endpoint
├── server.js                  # Server entry point
├── package.json
├── .env                       # Environment variables
└── .env.example               # Environment template
```

---

## 2. Database Schema

### 2.1 Design Decisions

- **No Foreign Key Constraints**: All relationships are handled at the application level, not database level. Foreign key columns exist as UUID fields (stored as VARCHAR(36)) but without `@relation` constraints.
- **Soft Deletes**: Users and therapists have `deleted_at` fields for soft deletion.
- **Multilingual Support**: Fields like `name`, `description`, `bio`, `title` are JSON to support multiple languages: `{"en": "...", "ar": "...", "ku": "..."}`
- **UUID Primary Keys**: All tables use UUID as primary keys (stored as VARCHAR(36) in MySQL).
- **Array Fields**: Fields that would be arrays (e.g., `spoken_languages`, `selected_option_ids`) are stored as JSON in MySQL.

### 2.2 Tables Created (27 total)

#### Users & Authentication
| Table | Description |
|-------|-------------|
| `users` | Patient/client accounts |
| `admins` | Administrator accounts |
| `therapists` | Therapist accounts |
| `roles` | RBAC roles (super_admin, admin, therapist, patient) |
| `permissions` | RBAC permissions (49 total) |
| `role_permissions` | Role-permission mapping |
| `refresh_tokens` | JWT refresh token storage |
| `otp_verifications` | OTP codes for phone verification |

#### Therapist Management
| Table | Description |
|-------|-------------|
| `specialties` | Therapy specialties (Anxiety, Depression, etc.) |
| `therapist_specialties` | Therapist-specialty mapping |
| `therapist_documents` | License, certifications, degrees |
| `therapist_availability` | Weekly availability schedule |
| `therapist_availability_exceptions` | Days off, special hours |

#### Bookings & Sessions
| Table | Description |
|-------|-------------|
| `bookings` | Appointment bookings |
| `sessions` | Video/audio/chat sessions |
| `conversations` | User-therapist conversations |
| `messages` | Chat messages |

#### Payments & Subscriptions
| Table | Description |
|-------|-------------|
| `payments` | Payment transactions |
| `subscriptions` | User subscriptions to therapists |
| `therapist_payouts` | Therapist payment disbursements |

#### Questionnaires
| Table | Description |
|-------|-------------|
| `questionnaire_categories` | Question categories |
| `questions` | Individual questions |
| `question_options` | Multiple choice options |
| `questionnaire_answers` | User responses |

#### System
| Table | Description |
|-------|-------------|
| `notifications` | Push/email/SMS notifications |
| `notification_templates` | Notification templates |
| `audit_logs` | Activity audit trail |
| `webhook_logs` | External webhook logging |

---

## 3. Authentication System

### 3.1 JWT Implementation

- **Access Token**: Short-lived (15 minutes default), used for API authentication
- **Refresh Token**: Long-lived (7 days default), stored in database, used to obtain new access tokens
- **Token Payload**: `{ id, email, type, role }`

### 3.2 User Types

| Type | Description |
|------|-------------|
| `admin` | Platform administrators |
| `therapist` | Mental health professionals |
| `user` | Patients/clients |

### 3.3 Auth Endpoints

```
POST /api/v1/auth/register/user        # Register new user
POST /api/v1/auth/register/therapist   # Register new therapist
POST /api/v1/auth/login/user           # User login
POST /api/v1/auth/login/therapist      # Therapist login
POST /api/v1/auth/login/admin          # Admin login
POST /api/v1/auth/refresh              # Refresh access token
POST /api/v1/auth/logout               # Logout (revoke refresh token)
POST /api/v1/auth/logout-all           # Logout from all devices
POST /api/v1/auth/change-password      # Change password
GET  /api/v1/auth/me                   # Get current user profile
```

### 3.4 Password Security

- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum 8 characters required
- Password validation utility available

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access (all 49 permissions) |
| `admin` | Administrative access (26 permissions) |
| `therapist` | Therapist operations (14 permissions) |
| `patient` | Patient operations (20 permissions) |

### 4.2 Permissions (49 total)

Permissions follow the pattern `module:action`:

```
users:read, users:create, users:update, users:delete
therapists:read, therapists:create, therapists:update, therapists:delete, therapists:approve
bookings:read, bookings:create, bookings:update, bookings:delete
sessions:read, sessions:create, sessions:update
payments:read, payments:create, payments:refund
conversations:read, conversations:create
messages:read, messages:create
questionnaires:read, questionnaires:create, questionnaires:update, questionnaires:delete
answers:read, answers:create
specialties:read, specialties:create, specialties:update, specialties:delete
subscriptions:read, subscriptions:create, subscriptions:update, subscriptions:cancel
admin:dashboard, admin:reports, admin:settings, admin:audit_logs
uploads:create, uploads:delete
notifications:read, notifications:create, notifications:templates
payouts:read, payouts:create, payouts:process
```

### 4.3 Middleware Usage

```javascript
import { authenticate } from "./middleware/auth.js";
import { authorize, PERMISSIONS } from "./middleware/rbac.js";

// Require authentication
router.get("/users", authenticate, ...);

// Require specific permission
router.get("/users", authenticate, authorize(PERMISSIONS.USERS_READ), ...);

// Require any of multiple permissions
router.get("/data", authenticate, authorizeAny("users:read", "admin:dashboard"), ...);

// Admin only
router.post("/admin", authenticate, adminOnly, ...);
```

---

## 5. API Modules

### 5.1 Auth Module (`/api/v1/auth`)
- User/therapist registration
- Login for all user types
- Token refresh and logout
- Password management

### 5.2 Users Module (`/api/v1/users`)
- List users (admin)
- Get user by ID
- Update user profile
- Soft delete user

### 5.3 Therapists Module (`/api/v1/therapists`)
- List approved therapists (public)
- Get therapist by ID
- Approve/reject therapist (admin)

### 5.4 Admin Module (`/api/v1/admin`)
- Dashboard statistics
- Admin management
- Audit logs

### 5.5 Bookings Module (`/api/v1/bookings`)
- Create booking
- List user/therapist bookings
- Confirm/cancel booking

### 5.6 Sessions Module (`/api/v1/sessions`)
- List sessions
- Start/end session

### 5.7 Payments Module (`/api/v1/payments`)
- Create payment
- List payments
- Webhook handler

### 5.8 Conversations Module (`/api/v1/conversations`)
- List conversations
- Get/send messages
- Create conversation

### 5.9 Questionnaires Module (`/api/v1/questionnaires`)
- List categories and questions
- Submit answers
- Create categories/questions (admin)

### 5.10 Specialties Module (`/api/v1/specialties`)
- List specialties (public)
- CRUD operations (admin)

### 5.11 Subscriptions Module (`/api/v1/subscriptions`)
- List subscriptions
- Create/cancel subscription

### 5.12 Uploads Module (`/api/v1/uploads`)
- Upload images
- Upload documents
- Upload avatar

---

## 6. Configuration

### 6.1 Environment Variables

```env
# Database (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/nurozh"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bunny CDN (optional)
BUNNY_CDN_STORAGE_ZONE=your-storage-zone
BUNNY_CDN_API_KEY=your-api-key
BUNNY_CDN_PULL_ZONE_URL=https://your-pullzone.b-cdn.net

# Logging
LOG_LEVEL=debug
```

### 6.2 Constants

All application constants are defined in `src/config/constants.js`:

- HTTP status codes
- Error messages
- User types and statuses
- Booking/session/payment statuses
- Notification channels
- Question types
- And more...

---

## 7. Seeded Data

Running `npm run seed` creates:

### 7.1 Roles & Permissions
- 4 roles with appropriate permission assignments
- 49 permissions across 13 modules

### 7.2 Super Admin Account
```
Email: admin@nurozh.com
Password: Admin@123456
Role: super_admin
```

### 7.3 Default Specialties (8)
1. Anxiety
2. Depression
3. Stress Management
4. Relationship Issues
5. Trauma & PTSD
6. Self-esteem
7. Addiction
8. Grief & Loss

All specialties include translations in English, Arabic, and Kurdish.

---

## 8. Utility Functions

### 8.1 JWT Utilities (`src/utils/jwt.js`)
- `generateAccessToken(payload)`
- `generateRefreshToken(payload)`
- `generateTokenPair(payload)`
- `verifyAccessToken(token)`
- `verifyRefreshToken(token)`
- `extractTokenFromHeader(authHeader)`

### 8.2 Password Utilities (`src/utils/password.js`)
- `hashPassword(password)`
- `comparePassword(password, hash)`
- `validatePasswordStrength(password)`
- `generateRandomPassword(length)`

### 8.3 Helper Functions (`src/utils/helpers.js`)
- `buildPaginationResponse(page, limit, total)`
- `parsePaginationParams(query)`
- `successResponse(data, message)`
- `paginatedResponse(data, pagination)`
- `sanitizeUser/Therapist/Admin(obj)`
- `getLocalizedValue(field, lang)`
- `generateOTP(length)`
- `pick(obj, keys)` / `omit(obj, keys)`
- And more...

### 8.4 Error Classes (`src/utils/errors.js`)
- `APIError` (base class)
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `DatabaseError` (500)
- `InternalServerError` (500)

---

## 9. Security Features

- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Enabled
- **Request ID**: UUID tracking for all requests
- **Password Hashing**: bcrypt with 12 rounds
- **JWT**: Secure token-based authentication
- **Input Validation**: Zod schema validation

---

## 10. Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run seed         # Seed database with initial data
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

---

## 11. API Documentation

Swagger/OpenAPI documentation is available at:
```
http://localhost:3000/api-docs
```

---

## 12. Testing the API

### Start the server
```bash
npm run dev
```

### Test health check
```bash
curl http://localhost:3000/health
```

### Test admin login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nurozh.com","password":"Admin@123456"}'
```

### Test protected endpoint
```bash
curl http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 13. Next Steps (Recommendations)

1. **Implement Bunny CDN upload service** for production file uploads
2. **Add video calling integration** (Daily.co, Twilio, or Agora)
3. **Implement push notifications** (Firebase FCM)
4. **Add payment provider integration** (Stripe, FuratPay)
5. **Implement email service** for notifications
6. **Add SMS service** for OTP verification
7. **Write unit and integration tests**
8. **Set up CI/CD pipeline**
9. **Add Redis** for session/permission caching
10. **Implement WebSocket** for real-time messaging

---

## 14. Dependencies Installed

### Production
- `@prisma/client` - Database ORM
- `axios` - HTTP client
- `bcryptjs` - Password hashing
- `compression` - Response compression
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `express` - Web framework
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `jsonwebtoken` - JWT authentication
- `morgan` - HTTP request logging
- `multer` - File upload handling
- `prisma` - Database toolkit
- `swagger-jsdoc` - Swagger documentation
- `swagger-ui-express` - Swagger UI
- `uuid` - UUID generation
- `winston` - Logging
- `zod` - Schema validation

### Development
- `eslint` - Code linting
- `prettier` - Code formatting
- `nodemon` - Auto-restart on changes

---

*Documentation generated on: December 15, 2025*
*Updated on: January 16, 2026 - Migrated from PostgreSQL to MySQL*
