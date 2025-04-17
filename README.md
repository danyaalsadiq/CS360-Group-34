# CAPS Management System

A comprehensive mental health support platform for students and mental health professionals.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- npm or yarn package manager

1. **Install dependencies**

```bash
npm install
# or
yarn install
```

2. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

This will start both the backend server (Express) and the frontend development server (Vite) concurrently.

The application should be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running in Production

```bash
npm start
# or
yarn start
```

## Project Structure

- `client/` - React frontend code
- `server/` - Express backend code
- `shared/` - Shared TypeScript types and schemas

## Features

- Student, therapist, and admin dashboards
- Appointment scheduling system
- Feedback system for therapists
- AI-powered chat for website navigation
- Discussion forums
- Resource library

## Authentication

The system uses session-based authentication with Passport.js. Default test accounts:
- Student: username `student`, password `password`
- Therapist: username `therapist`, password `password`
- Admin: username `admin`, password `password`

## Tech Stack

- **Frontend**: React, TailwindCSS, shadcn/ui components, React Query
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Passport.js with sessions
- **AI Integration**: GROQ API for the chatbot