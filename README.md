# ParkSpot - Find & Reserve Parking in Seconds

ParkSpot is a modern, high-performance **MERN Stack** (MongoDB, Express, React, Node.js) web application designed to simplify urban parking. It allows drivers to search, navigate, and book parking spaces in real-time while enabling property owners to list empty spots and earn revenue.

---

## 🌟 Key Features

*   **Dual-Role Platform**: Dedicated dashboards and registrations for **Drivers** (searching & booking) and **Owners** (listing & managing spaces).
*   **Interactive Maps**: Real-time geolocation-based search using Leaflet Maps to discover nearby available parking spaces.
*   **Secure Payment Integration**: Production-ready **Razorpay Checkout SDK** support for slot bookings and automated instant refund handling.
*   **Real-Time Sync**: Instant booking confirmations, cancellations, and notifications powered by **Socket.io**.
*   **Automated Scheduling**: Cron jobs configured via **node-cron** to monitor active bookings and send warnings to drivers 10 minutes before their slot expires.
*   **Transactional Emails**: Automated welcome emails and password reset links powered by **Nodemailer** and **Brevo (Sendinblue)**.
*   **Robust Security**: Fully protected against common vulnerabilities using Helmet headers, Express-Rate-Limiter, cookie-based JWT tokens, and NoSQL injection sanitizers.

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 19, Vite, ES6 Javascript
*   **Styling**: Tailwind CSS v4 (using the `@tailwindcss/vite` compiler)
*   **Icons**: Lucide React
*   **Maps**: Leaflet (React Leaflet) for interactive mapping and coordinate picking
*   **State & Networking**: Axios, Context API (`AuthContext`)
*   **WebSockets**: Socket.io-client

### Backend
*   **Core**: Node.js, Express 5
*   **Database**: MongoDB, Mongoose ODM
*   **Payments**: Razorpay Node SDK
*   **Image Storage**: Cloudinary (fallback to local server filesystem)
*   **Job Scheduler**: node-cron (for background checks)
*   **Email Engine**: Nodemailer
*   **Security**: Helmet, Cookie-Parser, Express-Rate-Limit, Express-Mongo-Sanitize, BcryptJS

---

## 📂 Project Structure

```text
ParkNow - MERN/
├── client/                     # Frontend Vite + React Project
│   ├── public/                 # Static assets (Favicons, public resources)
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Navbar, Protective Routes, Modals)
│   │   ├── context/            # AuthContext.jsx for session management
│   │   ├── hooks/              # Custom hooks (useAuth.js)
│   │   ├── pages/              # Primary pages (Dashboards, Home Map, Auth screens)
│   │   ├── services/           # API instances (axios base client)
│   │   ├── App.jsx             # Main routing map definitions
│   │   └── main.jsx            # Entry mount point
│   ├── index.html              # Main HTML mount (contains CDNs for Leaflet & Razorpay)
│   └── package.json
│
├── server/                     # Backend Node.js Express API
│   ├── config/                 # DB connection and mongoose setups
│   ├── controllers/            # Controller layers containing core route logic
│   ├── middleware/             # Route guards (Authentication and Role validation)
│   ├── models/                 # Database Mongoose Schemas (User, Spot, Booking, Review)
│   ├── routes/                 # Express API Endpoint routes
│   ├── uploads/                # Local directory for photo uploads fallback
│   ├── utils/                  # Helper libraries (Email templates, Cron schedulers, Seed data)
│   ├── index.js                # Core app configuration & server port initialization
│   └── package.json
│
└── .env                        # Central project environment variables
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas cluster)

### Step 1: Clone and Configure Environment Variables
Create a file named `.env` in the root folder of the project. Copy and update the following settings:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/parkspot
JWT_SECRET=super_secret_jwt_key_for_parkspot_2026_dev
JWT_EXPIRE=7d

# Razorpay API Keys (Get from Dashboard -> Settings -> API Keys)
RAZORPAY_KEY_ID=rzp_test_yourKeyID
RAZORPAY_KEY_SECRET=yourKeySecret

# Cloudinary Config (Optional, leave as placeholder to fall back to local disk storage)
CLOUDINARY_CLOUD_NAME=cloudinary_cloud_placeholder
CLOUDINARY_API_KEY=cloudinary_key_placeholder
CLOUDINARY_API_SECRET=cloudinary_secret_placeholder

# Transactional Email Config (Nodemailer + Brevo / Gmail)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_smtp_login
EMAIL_PASS=your_brevo_smtp_password
EMAIL_FROM=your_verified_sender_email@domain.com
```

---

### Step 2: Install Backend Dependencies & Seed Database
Open a terminal in the `server` directory to install modules and populate mock records (driver, owner, spots):

```bash
cd server
npm install
npm run seed
```

---

### Step 3: Run the Application

#### Start the Backend API Server:
Inside the `server` folder, run:
```bash
npm run dev
```
*(The server will start on port `5000` with nodemon active).*

#### Start the Frontend Client:
Open a second terminal window, navigate to the `client` folder, install packages, and launch Vite:
```bash
cd client
npm install
npm run dev
```
*(The client will run on http://localhost:5173/)*.

---

## 🔌 API Documentation (Major Endpoints)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new User account | Public |
| **POST** | `/api/auth/login` | Authenticate credentials and get Cookie | Public |
| **POST** | `/api/auth/logout` | Clear Session & Logout | Public |
| **GET** | `/api/auth/me` | Fetch active user profile data | Private |
| **GET** | `/api/spots` | Retrieve all active listed parking spots | Public |
| **POST** | `/api/spots` | Create a new parking spot | Private (Owner Only) |
| **POST** | `/api/bookings` | Create a pending reservation slot | Private (Driver Only) |
| **POST** | `/api/payments/create-order` | Request Razorpay order checkout parameters | Private |
| **POST** | `/api/payments/verify` | Verify signatures and confirm spot booking | Private |
| **POST** | `/api/payments/refund/:bookingId` | Trigger manual/auto refund on cancellation | Private |

---

## 🔒 Security Best Practices Implemented
1.  **Rate Limiter**: Mitigates DDoS and brute-force login attempts using `express-rate-limit`.
2.  **NoSQL Injection Guard**: Sanitizes user payloads using `express-mongo-sanitize`.
3.  **HTTP Headers Protection**: Mounts custom security headers utilizing `helmet`.
4.  **HttpOnly JWT Session Storage**: Prevents XSS script access to tokens by sealing them inside cookies.
5.  **CORS Isolation**: Strict domain verification config restricted to client origins.
