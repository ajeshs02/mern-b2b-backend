# 🧠 MERN B2B Backend – Project Management API (Node.js, TypeScript, MongoDB)

A powerful backend API for a team collaboration platform inspired by Jira — built with **Node.js**, **TypeScript**, and **MongoDB**, and deployed using **Docker + Google Cloud Run**.

This backend supports Google OAuth login, role-based permissions, session-based authentication, multi-workspace support, and all API routes for users, workspaces, projects, tasks, and epics.

---

## 🚀 Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Auth:** Passport.js (Google OAuth + Local)
- **Session:** Cookie-based sessions using `cookie-session`
- **Validation:** Zod
- **Database:** MongoDB Atlas (with Mongoose)
- **Deployment:** Docker + GCP Cloud Run
- **Others:** UUID, dotenv, CORS, async handlers

---

## 📦 Features

- 🔐 Google Sign-In + Local Auth via Passport
- 🏢 Create and manage multi-tenant workspaces
- ✅ Full CRUD for Projects, Epics, Tasks
- 👥 Role-based permissions: Owner, Admin, Member
- ✉️ Invite members via email
- 📊 Analytics endpoints (basic)
- 🔒 Session-based cookie authentication
- 💾 MongoDB transactions
- 📁Modular Clean Architecture (service-controller pattern with middleware, routes, and domain separation)

---

## 📁 Folder Structure

server/
├── src/
│ ├── config/
│ ├── controllers/
│ ├── middlewares/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── utils/
│ └── validation/
├── .env
├── Dockerfile
└── package.json

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/mern-b2b-backend.git
cd mern-b2b-backend
```

### 2. Install dependencies

npm install

### 3. Setup environment variables

PORT=8000
BASE_PATH=/api
NODE_ENV=development

MONGO_URI=mongodb+srv://<your-uri>
SESSION_SECRET=your_cookie_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url/api/auth/google/callback
FRONTEND_ORIGIN=https://your-frontend.vercel.app

### 4. Run in development

npm run dev

## ⚙️ Docker Deployment (Cloud Run)

### 1. Build the Docker image

docker build -t mern-b2b-backend .

### 2. Run locally

docker run -p 8000:8000 --env-file .env mern-b2b-backend
