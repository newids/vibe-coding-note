# Vibe Coding Notes

A web application for managing coding tool notes and experiences. Built with React, TypeScript, Express.js, and PostgreSQL.

## Project Structure

```
vibe-coding-notes/
├── frontend/          # React frontend with Vite and TypeScript
├── backend/           # Express.js backend with TypeScript
├── package.json       # Root package.json for managing both apps
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis (optional, for caching)

### Installation

1. Clone the repository
2. Install dependencies for all projects:

   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Update the environment variables with your configuration

### Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:

- Frontend on http://localhost:5173
- Backend on http://localhost:3001

### Individual Commands

- Frontend only: `npm run dev:frontend`
- Backend only: `npm run dev:backend`
- Build all: `npm run build`
- Build frontend: `npm run build:frontend`
- Build backend: `npm run build:backend`

## Features

- User authentication (email/password and OAuth)
- Note creation and management
- Commenting system
- Anonymous likes
- Tag and category system
- Search and filtering
- Responsive design

## Tech Stack

### Frontend

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui
- React Query for state management

### Backend

- Node.js with Express.js
- TypeScript
- Prisma ORM
- Passport.js for authentication
- PostgreSQL database

## License

ISC
