# Badminton Court Booking System - Backend API

A RESTful backend API for managing badminton court reservations and player authentication, built with **Express 5**, **TypeScript**, **MongoDB (Mongoose)**, and **JWT**.

---

## 🏸 Features

- **Authentication & Authorization**: Secure user registration and login with bcrypt password hashing and JSON Web Tokens (JWT).
- **Protected Resources**: All booking CRUD endpoints are protected by JWT Bearer token authentication with strict per-user authorization (users can only access and modify their own bookings).
- **Courts Directory**: Pre-configured facility courts listing and details.
- **Booking Management**: Full CRUD operations for court reservations with robust validation (date validation, duration limit between 1–8 hours, enum status management).
- **Windows DNS Fix**: Integrated DNS resolver fallback (`8.8.8.8` / `1.1.1.1`) to resolve MongoDB Atlas SRV query issues on local networks.

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/) (v5)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Development Tooling**: [tsx](https://github.com/privatenumber/tsx) (Zero-config TypeScript execute & watch)

---

## 📁 Project Structure

```text
itelect4-backend/
├── .env.example              # Sample environment variables
├── package.json              # Dependencies and NPM scripts
├── tsconfig.json             # TypeScript compiler configuration
├── scripts/
│   └── generate-secret.js    # Utility script to generate a secure JWT secret
└── src/
    ├── index.ts              # Server entry point & court mock data
    ├── middleware/
    │   └── auth.ts           # JWT authentication middleware
    ├── models/
    │   ├── Booking.ts        # Mongoose schema & model for Bookings
    │   ├── User.ts           # Mongoose schema & model for Users
    │   └── index.ts          # Models barrel export
    ├── routes/
    │   ├── auth.ts           # Authentication routes (/api/auth)
    │   ├── bookings.ts       # Booking CRUD routes (/api/bookings)
    │   └── index.ts          # Routes barrel export
    └── types/
        └── index.ts          # TypeScript interfaces, types & enums
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- A **MongoDB Atlas** connection string (or local MongoDB instance)

### 2. Installation

Clone or download the repository, then install project dependencies:

```bash
npm install
```

### 3. Environment Configuration

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/itelect4?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=4000
```

> **Tip:** You can automatically generate a secure random base64 string for `JWT_SECRET` in your `.env` by running:
> ```bash
> npm run generate-secret
> ```

---

## 💻 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with live reload via `tsx watch` |
| `npm run build` | Compiles TypeScript source files into `dist/` |
| `npm start` | Runs the compiled production code (`dist/index.js`) |
| `npm run generate-secret` | Generates a 32-byte crypto random string and writes it to `JWT_SECRET` in `.env` |

---

## 📡 API Reference

Base URL: `http://localhost:4000`

### 1. General & Health

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | API root index and route directory | No |
| `GET` | `/api/health` | Health check endpoint | No |

---

### 2. Courts

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/courts` | Retrieve list of all available courts | No |
| `GET` | `/api/courts/:id` | Retrieve court details by court ID | No |

---

### 3. Authentication (`/api/auth`)

#### Register a New User
- **Method:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "name": "Juan Dela Cruz",
    "email": "juan@example.com",
    "password": "Password123!",
    "role": "player"
  }
  ```
- **Responses:**
  - `201 Created`: User successfully registered.
  - `400 Bad Request`: Missing required fields or schema validation failure.
  - `409 Conflict`: Email is already registered.

#### Login User
- **Method:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "juan@example.com",
    "password": "Password123!"
  }
  ```
- **Response:**
  - `200 OK`:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "role": "player"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

---

### 4. Bookings (`/api/bookings` & `/api/submissions`)

> **Note:** All booking routes require a valid JWT passed in the HTTP Authorization header:
> ```http
> Authorization: Bearer <your_jwt_token>
> ```

#### Get All Bookings (Current User)
- **Method:** `GET /api/bookings`
- **Description:** Returns all bookings associated with the authenticated user.
- **Response:** `200 OK` (Array of bookings)

#### Get Booking by ID
- **Method:** `GET /api/bookings/:id`
- **Description:** Returns a specific booking belonging to the authenticated user.
- **Response:** `200 OK` or `404 Not Found`

#### Create a Booking
- **Method:** `POST /api/bookings`
- **Request Body:**
  ```json
  {
    "courtId": 1,
    "bookingDate": "2026-10-15T09:00:00.000Z",
    "durationHours": 2,
    "status": "pending"
  }
  ```
- **Validation Rules:**
  - `courtId`: Required number
  - `bookingDate`: Required valid ISO Date string
  - `durationHours`: Number between `1` and `8` (default: `1`)
  - `status`: One of `pending`, `approved`, `declined`, `cancelled`, `completed` (default: `pending`)
- **Response:** `201 Created`

#### Update a Booking
- **Method:** `PUT /api/bookings/:id`
- **Request Body:**
  ```json
  {
    "durationHours": 3,
    "status": "cancelled"
  }
  ```
- **Response:** `200 OK` (Updated booking object) or `404 Not Found`

#### Delete / Cancel a Booking
- **Method:** `DELETE /api/bookings/:id`
- **Response:**
  - `200 OK`:
    ```json
    {
      "message": "Booking successfully cancelled/deleted",
      "id": "<booking_id>"
    }
    ```
  - `404 Not Found`: Booking does not exist or does not belong to user.

---

## 🔒 Security Best Practices

1. **Keep Secrets Out of Version Control**: Never commit `.env` or sensitive MongoDB credentials to Git. `.gitignore` is pre-configured to exclude `.env` and `node_modules/`.
2. **JWT Expiration**: Issued tokens are configured to expire in 2 hours (`expiresIn: "2h"`).
3. **Password Hashing**: Passwords are salted and hashed using `bcryptjs` with 10 salt rounds before persistence.
