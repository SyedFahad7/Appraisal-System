// MongoDB setup script for Faculty Appraisal System
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

// Connection URL and Database Name
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'faculty-appraisal-system';

async function setupDatabase() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to MongoDB server');

    const db = client.db(dbName);

    // Create collections if they don't exist
    await db.createCollection('departments');
    await db.createCollection('users');

    // Create Computer Science department
    const departmentsCollection = db.collection('departments');
    const existingDepartment = await departmentsCollection.findOne({ name: 'Computer Science' });

    let departmentId;
    if (!existingDepartment) {
      const departmentResult = await departmentsCollection.insertOne({
        name: 'Computer Science',
        code: 'CS',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      departmentId = departmentResult.insertedId;
      console.log('Created Computer Science department');
    } else {
      departmentId = existingDepartment._id;
      console.log('Computer Science department already exists');
    }

    // Hash passwords
    const saltRounds = 10;
    const defaultPassword = 'password123'; // This should be changed after first login
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Create users
    const usersCollection = db.collection('users');

    // Create Principal
    const existingPrincipal = await usersCollection.findOne({ email: 'principal@lords.ac.in' });
    if (!existingPrincipal) {
      await usersCollection.insertOne({
        name: 'Principal',
        email: 'principal@lords.ac.in',
        password: hashedPassword,
        role: 'Principal',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Principal user');
    } else {
      console.log('Principal user already exists');
    }

    // Create HOD
    const existingHOD = await usersCollection.findOne({ email: 'hod@lords.ac.in' });
    if (!existingHOD) {
      await usersCollection.insertOne({
        name: 'HOD',
        email: 'hod@lords.ac.in',
        password: hashedPassword,
        role: 'HOD',
        departmentId: departmentId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created HOD user');
    } else {
      console.log('HOD user already exists');
    }

    // Create Faculty
    const existingFaculty = await usersCollection.findOne({ email: 'faculty1@lords.ac.in' });
    if (!existingFaculty) {
      await usersCollection.insertOne({
        name: 'Faculty 1',
        email: 'faculty1@lords.ac.in',
        password: hashedPassword,
        role: 'Faculty',
        departmentId: departmentId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Faculty user');
    } else {
      console.log('Faculty user already exists');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the setup function
setupDatabase();
