# Faculty Appraisal System - Setup Guide

This guide provides detailed instructions for setting up the Faculty Appraisal System environment and database.

## Environment Variables Setup

1. **Create .env file**

   Copy the `.env.example` file to create your `.env` file:

   ```bash
   cp .env.example .env
   ```

2. **Configure MongoDB URI**

   You have two options for MongoDB setup:

   ### Option 1: MongoDB Atlas (Cloud)

   1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   2. Create a new cluster (the free tier is sufficient for development)
   3. Click on "Connect" and select "Connect your application"
   4. Copy the connection string and replace the placeholders:

      ```
      MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
      ```

      - Replace `<username>` and `<password>` with your MongoDB Atlas user credentials
      - Replace `<cluster-url>` with your cluster URL (e.g., `cluster0.abc123.mongodb.net`)
      - Replace `<database-name>` with your preferred database name (e.g., `faculty-appraisal-system`)

   ### Option 2: Local MongoDB

   If you have MongoDB installed locally:

   ```
   MONGODB_URI=mongodb://localhost:27017/faculty-appraisal-system
   ```

3. **Configure JWT Secret**

   Generate a secure random string for your JWT secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output and set it as your JWT_SECRET:

   ```
   JWT_SECRET=your_generated_secret_here
   ```

4. **Set JWT Expiration**

   ```
   JWT_EXPIRES_IN=7d
   ```

5. **Set Application Port and Environment**

   ```
   PORT=3000
   NODE_ENV=development
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

## Database Setup

1. **Install Required Dependencies**

   Make sure you have the required packages installed:

   ```bash
   npm install bcryptjs mongodb dotenv
   ```

2. **Run the Database Setup Script**

   The project includes a script to initialize the database with default departments and users:

   ```bash
   node scripts/db-setup.js
   ```

   This script will:
   - Connect to your MongoDB database
   - Create necessary collections
   - Create a Computer Science department
   - Create default users with the following credentials:
     - Principal: principal@lords.ac.in / password123
     - HOD: hod@lords.ac.in / password123
     - Faculty: faculty1@lords.ac.in / password123

3. **Verify Database Setup**

   You can verify the database setup by checking the console output of the script. It should show messages indicating that collections and users were created successfully.

## Running the Application

1. **Start the Development Server**

   ```bash
   npm run dev
   ```

2. **Access the Application**

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

3. **Login with Default Credentials**

   You can log in using any of the default user credentials created during database setup.

## Troubleshooting

### MongoDB Connection Issues

- Ensure your MongoDB server is running (if using local MongoDB)
- Check that your connection string is correct
- Verify network connectivity to MongoDB Atlas (if using cloud)

### JWT Authentication Issues

- Make sure your JWT_SECRET is properly set
- Check that JWT_EXPIRES_IN is a valid time format

### Database Setup Script Errors

- Ensure you have the required dependencies installed
- Check that your .env file is properly configured
- Verify that you have proper permissions to create databases and collections

## Security Notes

- Change the default passwords after first login
- In production, use a strong, unique JWT secret
- Consider enabling MongoDB authentication for local installations
- Store sensitive environment variables securely in production environments