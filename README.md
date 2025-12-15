# Express API

A production-ready RESTful API built with Express.js, Prisma ORM, and PostgreSQL following industry best practices.

## Features

- RESTful API design with API versioning
- Input validation using Zod schemas
- Comprehensive error handling
- Request/Response logging with Winston
- Security headers with Helmet
- Rate limiting protection
- CORS enabled
- Response compression
- Request correlation IDs for tracing
- Health check endpoint
- Graceful shutdown handling
- OpenAPI/Swagger documentation
- ESLint and Prettier configured
- Environment variable validation

## Tech Stack

- **Runtime:** Node.js (>=18.0.0)
- **Framework:** Express.js v5
- **Database:** PostgreSQL
- **ORM:** Prisma v6
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, express-rate-limit
- **Documentation:** Swagger/OpenAPI
- **Code Quality:** ESLint, Prettier

## Project Structure

```
├── config/               # Configuration files
│   ├── constants.js      # Application constants
│   ├── env.js            # Environment validation
│   ├── logger.js         # Winston logger setup
│   ├── prisma.js         # Prisma client
│   └── swagger.js        # API documentation config
├── middleware/           # Custom middleware
│   ├── errorHandler.js   # Global error handler
│   ├── requestId.js      # Request ID tracking
│   ├── security.js       # Security middleware
│   └── validate.js       # Zod validation middleware
├── prisma/               # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── routes/               # API routes
│   └── health.routes.js
├── utils/                # Utility functions
│   └── errors.js         # Custom error classes
├── app.js                # Express app setup
├── server.js             # Server entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd express-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# Logging
LOG_LEVEL=debug
```

4. Generate Prisma client
```bash
npm run prisma:generate
```

5. Run database migrations
```bash
npm run prisma:migrate
```

6. Start the server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Interactive Documentation

Visit `http://localhost:3000/api-docs` for the full Swagger/OpenAPI documentation.

### Endpoints

#### Health Check
```http
GET /health
```

## Development

### Available Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Code Quality

The project uses ESLint and Prettier for code quality and formatting.

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format all files
npm run format
```

## Error Handling

The API uses custom error classes for consistent error responses:

- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `InternalServerError` (500)

All errors include:
- `success`: false
- `error.message`: Human-readable error message
- `error.errors`: Array of validation errors (if applicable)
- `requestId`: Correlation ID for tracing

## Security Features

- **Helmet**: Sets security HTTP headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Cross-Origin Resource Sharing enabled
- **Input Validation**: Zod schema validation on all inputs
- **Request Size Limits**: 10MB max request body
- **Environment Validation**: All environment variables validated at startup

## Logging

Winston is used for structured logging with the following features:

- Console output with colors
- File logging (error.log, combined.log)
- Log rotation (5MB max file size, 5 files max)
- Request correlation IDs
- Different log levels based on environment

Logs are stored in the `logs/` directory.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | Yes | development | Environment (development/production/test) |
| PORT | No | 3000 | Server port |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| LOG_LEVEL | No | info | Logging level (error/warn/info/debug) |

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong database credentials
- [ ] Set up SSL/TLS for database connection
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up process manager (PM2)
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Review and adjust rate limits
- [ ] Update CORS configuration for production domains

### PM2 Example

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name api

# Setup auto-restart on system reboot
pm2 startup
pm2 save
```

## Graceful Shutdown

The application handles graceful shutdown for:
- SIGTERM signal
- SIGINT signal (Ctrl+C)
- Uncaught exceptions
- Unhandled promise rejections

On shutdown, the application will:
1. Stop accepting new requests
2. Close the HTTP server
3. Disconnect from the database
4. Exit the process

Timeout: 30 seconds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting
5. Commit your changes
6. Push to your fork
7. Create a Pull Request

## License

ISC
