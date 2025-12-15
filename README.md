# Nurozh Therapy Platform API

A comprehensive therapy and mental health platform API built with Express.js, Prisma ORM, and PostgreSQL.

## Features

- **Multi-User Authentication** - JWT-based auth for admins, therapists, and patients
- **Role-Based Access Control** - 4 roles with 49 granular permissions
- **Booking System** - Schedule and manage therapy sessions
- **Video/Audio Sessions** - Support for video, audio, and chat sessions
- **Messaging** - Real-time conversations between users and therapists
- **Questionnaires** - Mental health assessments and onboarding
- **Subscriptions & Payments** - Flexible payment and subscription management
- **Multilingual Support** - English, Arabic, and Kurdish (en, ar, ku)
- **Security** - Helmet, rate limiting, input validation
- **API Documentation** - Swagger/OpenAPI

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nurozh_therapist_project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run seed

# Start development server
npm run dev
```

### Default Admin Account

After seeding, login with:
- **Email**: `admin@nurozh.com`
- **Password**: `Admin@123456`

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── constants.js     # Application constants & enums
│   ├── env.js           # Environment validation (Zod)
│   ├── logger.js        # Winston logger setup
│   ├── prisma.js        # Prisma client instance
│   └── swagger.js       # API documentation config
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   ├── rbac.js          # Role-based access control
│   ├── errorHandler.js  # Global error handler
│   ├── requestId.js     # Request ID tracking
│   ├── security.js      # Helmet & rate limiting
│   └── validate.js      # Zod validation middleware
├── modules/             # Feature modules
│   ├── auth/            # Authentication
│   ├── users/           # User management
│   ├── therapists/      # Therapist management
│   ├── admin/           # Admin operations
│   ├── bookings/        # Booking system
│   ├── sessions/        # Session management
│   ├── payments/        # Payment processing
│   ├── conversations/   # Messaging
│   ├── questionnaires/  # Assessments
│   ├── specialties/     # Therapy specialties
│   ├── subscriptions/   # Subscriptions
│   └── uploads/         # File uploads
├── utils/               # Utility functions
│   ├── errors.js        # Custom error classes
│   ├── helpers.js       # Helper functions
│   ├── jwt.js           # JWT utilities
│   └── password.js      # Password utilities
├── seeders/             # Database seeders
│   └── seed.js
└── app.js               # Express app setup
```

## API Documentation

Access Swagger documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/user` | Register new user |
| POST | `/api/v1/auth/register/therapist` | Register new therapist |
| POST | `/api/v1/auth/login/user` | User login |
| POST | `/api/v1/auth/login/therapist` | Therapist login |
| POST | `/api/v1/auth/login/admin` | Admin login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (admin) |
| GET | `/api/v1/therapists` | List approved therapists |
| GET | `/api/v1/specialties` | List therapy specialties |
| GET/POST | `/api/v1/bookings` | Manage bookings |
| GET | `/api/v1/sessions` | List sessions |
| GET/POST | `/api/v1/conversations` | Manage conversations |
| GET/POST | `/api/v1/payments` | Manage payments |
| GET | `/api/v1/questionnaires/questions` | Get questionnaire |
| GET/POST | `/api/v1/subscriptions` | Manage subscriptions |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Start production server |
| `npm run seed` | Seed database with initial data |
| `npm run prisma:studio` | Open Prisma database GUI |
| `npm run prisma:migrate` | Run database migrations |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nurozh"

# Server
PORT=3000
NODE_ENV=development

# JWT Secrets (minimum 32 characters)
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bunny CDN (optional)
BUNNY_CDN_STORAGE_ZONE=your-zone
BUNNY_CDN_API_KEY=your-key
BUNNY_CDN_PULL_ZONE_URL=https://your-cdn.b-cdn.net

# Logging
LOG_LEVEL=debug
```

## Database Schema

27 database tables including:

| Category | Tables |
|----------|--------|
| **Users & Auth** | users, admins, therapists, roles, permissions, role_permissions, refresh_tokens, otp_verifications |
| **Therapy** | specialties, therapist_specialties, therapist_documents, therapist_availability, therapist_availability_exceptions |
| **Bookings** | bookings, sessions, conversations, messages |
| **Payments** | payments, subscriptions, therapist_payouts |
| **Questionnaires** | questionnaire_categories, questions, question_options, questionnaire_answers |
| **System** | notifications, notification_templates, audit_logs, webhook_logs |

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete schema details.

## Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Full system access | All 49 |
| `admin` | Administrative access | 26 |
| `therapist` | Therapist operations | 14 |
| `patient` | Patient operations | 20 |

## Security Features

- **Helmet.js** - Security HTTP headers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Password Hashing** - bcrypt with 12 rounds
- **JWT Authentication** - Access + refresh token pattern
- **Input Validation** - Zod schema validation
- **Request Tracking** - Correlation IDs for tracing
- **CORS** - Cross-Origin Resource Sharing enabled

## Error Handling

Custom error classes for consistent responses:

- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `DatabaseError` (500)
- `InternalServerError` (500)

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up process manager (PM2)
- [ ] Configure log aggregation
- [ ] Set up monitoring
- [ ] Update CORS for production domains

### PM2 Example

```bash
pm2 start server.js --name nurozh-api
pm2 startup
pm2 save
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC
