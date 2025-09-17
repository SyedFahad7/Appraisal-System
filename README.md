# Faculty Appraisal System

A full-stack web application for managing faculty performance appraisals at LORDS Institute. This project is built with [Next.js](https://nextjs.org).

## Setup Instructions

### Prerequisites

- Node.js (v16 or later)
- MongoDB (local installation or MongoDB Atlas account)
- Git

### Installation Steps

1. **Clone the repository and install dependencies**

```bash
git clone <repository-url>
cd faculty-appraisal-system
npm install
```

2. **Environment Configuration**

- Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

- Edit the `.env` file with your specific configuration:

#### MongoDB URI Setup

- **For MongoDB Atlas:**
  1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a new cluster
  3. Click "Connect" and select "Connect your application"
  4. Copy the connection string and replace `<username>`, `<password>`, `<cluster-url>`, and `<database-name>` with your values

- **For local MongoDB:**
  - Use `mongodb://localhost:27017/faculty-appraisal-system`

#### JWT Secret Setup

- Generate a strong random string for JWT_SECRET
- You can use this command to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Database Initialization**

```bash
node scripts/db-setup.js
```

4. **Run the Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## System Features

- **User Authentication**: Secure login with role-based access control (Faculty, HOD, Principal, Admin)
- **Faculty Self-Appraisal**: Form for faculty to submit their performance details
- **HOD Assessment**: Interface for HODs to review and score faculty performance
- **Principal's Review**: Final review and remarks by the Principal
- **Dashboard**: Role-specific dashboards with relevant statistics and actions
- **Reports**: Comprehensive reporting and analytics

## System Architecture

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure

- `/src/app` - Next.js application pages and API routes
- `/src/models` - MongoDB schema models
- `/src/lib` - Utility functions and database connection
- `/public` - Static assets

## Default User Credentials

- **Admin**: admin@lords.ac.in / admin123
- **Principal**: principal@lords.ac.in / password123
- **HOD**: hod@lords.ac.in / password123
- **Faculty**: faculty@lords.ac.in / password123

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For other deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
