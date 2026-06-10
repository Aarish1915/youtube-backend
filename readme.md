# 🎬 YouTube Backend API

A production-grade RESTful API backend for a YouTube-style video platform built with **Node.js**, **Express**, and **MongoDB**. Features JWT authentication with refresh token rotation, Cloudinary-based video uploads, and a modular MVC architecture.

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

---

## ✨ Key Features

- **JWT Authentication** — Register, login, logout with access + refresh token rotation
- **Video Management** — Upload, list, and retrieve videos with Cloudinary storage
- **Comments System** — Add and retrieve comments on videos
- **User Profiles** — Profile management with avatar uploads and watch history
- **Input Validation** — Request validation using Joi schemas
- **Security Hardened** — Helmet headers, CORS, bcrypt password hashing
- **Global Error Handling** — Centralized error middleware with custom `ApiError` class
- **Testing Ready** — Jest + Supertest setup with MongoDB Memory Server

---

## 🏗️ Architecture

```
src/
├── config/          # Environment variables and app configuration
├── controllers/     # Request handlers (auth, user, video, comment)
├── db/              # MongoDB connection setup
├── middlewares/      # Auth guard, file upload, error handling
├── models/          # Mongoose schemas (User, Video, Comment)
├── routes/          # Express route definitions
├── services/        # Cloudinary integration service
├── utils/           # ApiError, ApiResponse, asyncHandler
└── validators/      # Joi validation schemas
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/Aarish1915/youtube-backend.git
cd youtube-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and Cloudinary keys

# Start development server
npm run dev
```

The server will start at `http://localhost:8000`

---

## 📡 API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint    | Description              | Auth |
|--------|-------------|--------------------------|------|
| POST   | `/register` | Register a new user      | ❌   |
| POST   | `/login`    | Login and receive tokens | ❌   |
| POST   | `/refresh`  | Refresh access token     | ❌   |
| POST   | `/logout`   | Invalidate refresh token | ❌   |

### Users (`/api/v1/users`)

| Method | Endpoint         | Description                     | Auth |
|--------|------------------|---------------------------------|------|
| POST   | `/register`      | Register with avatar upload     | ❌   |
| GET    | `/me`            | Get current user profile        | ✅   |
| POST   | `/watch-history` | Add video to watch history      | ✅   |

### Videos (`/api/v1/videos`)

| Method | Endpoint   | Description                  | Auth |
|--------|------------|------------------------------|------|
| GET    | `/`        | List all public videos       | ❌   |
| POST   | `/upload`  | Upload a new video           | ✅   |
| GET    | `/:id`     | Get video by ID              | ❌   |

### Comments (`/api/v1/comments`)

| Method | Endpoint          | Description              | Auth |
|--------|-------------------|--------------------------|------|
| POST   | `/`               | Create a comment         | ✅   |
| GET    | `/video/:videoId` | Get comments for a video | ❌   |

---

## 🔐 Authentication Flow

```
┌─────────┐       POST /auth/register        ┌──────────┐
│  Client  │ ──────────────────────────────▶  │  Server  │
│          │  ◀──────────────────────────────  │          │
│          │       201 { user }               │          │
│          │                                  │          │
│          │       POST /auth/login           │          │
│          │ ──────────────────────────────▶  │          │
│          │  ◀──────────────────────────────  │          │
│          │  200 { accessToken, refreshToken }│          │
│          │                                  │          │
│          │  GET /users/me                   │          │
│          │  Authorization: Bearer <token>   │          │
│          │ ──────────────────────────────▶  │          │
│          │  ◀──────────────────────────────  │          │
│          │       200 { user, watchHistory }  │          │
└─────────┘                                  └──────────┘
```

---

## 🧪 Testing

```bash
# Run all tests
npm test
```

Tests use **MongoDB Memory Server** for an isolated in-memory database — no external DB required.

---

## 🛡️ Security Practices

| Practice | Implementation |
|----------|---------------|
| Password Hashing | bcrypt with salt rounds (10) |
| JWT Tokens | Short-lived access (15m) + rotating refresh (7d) |
| Input Validation | Joi schemas on all endpoints |
| HTTP Headers | Helmet middleware for security headers |
| CORS | Configurable origin whitelist |
| Error Masking | Stack traces hidden in production |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js |
| Framework | Express v5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) |
| File Storage | Cloudinary |
| File Upload | Multer |
| Validation | Joi |
| Security | Helmet, CORS, bcrypt |
| Testing | Jest, Supertest |
| Logging | Morgan |

---

## 📄 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URL` | MongoDB connection URI | — |
| `DB_NAME` | Database name | — |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | — |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | — |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

---

## 📁 Scripts

```bash
npm run dev      # Start with nodemon (hot reload)
npm start        # Start production server
npm test         # Run test suite
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the ISC License.

---

**Built with ❤️ by [Aarish Ali](https://github.com/Aarish1915)**