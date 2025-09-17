// MongoDB Setup Script for LORDS Institute Faculty Appraisal System
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URI
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database reference
    const db = client.db('lords_faculty_appraisal');
    
    // Create collections
    const departmentsCollection = db.collection('departments');
    const usersCollection = db.collection('users');
    
    // Drop existing collections if they exist (for clean setup)
    await departmentsCollection.drop().catch(() => console.log('Departments collection does not exist yet'));
    await usersCollection.drop().catch(() => console.log('Users collection does not exist yet'));
    
    // Create Computer Science department
    const csDepartment = {
      name: 'Computer Science',
      code: 'CS',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const departmentResult = await departmentsCollection.insertOne(csDepartment);
    console.log(`Created department with ID: ${departmentResult.insertedId}`);
    
    // Hash passwords
    const saltRounds = 10;
    const principalPassword = await bcrypt.hash('principal123', saltRounds);
    const hodPassword = await bcrypt.hash('hod123', saltRounds);
    const facultyPassword = await bcrypt.hash('faculty123', saltRounds);
    
    // Create users
    const users = [
      {
        email: 'principal@lords.ac.in',
        password: principalPassword,
        role: 'Principal',
        name: 'Principal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'hod@lords.ac.in',
        password: hodPassword,
        role: 'HOD',
        name: 'HOD CS',
        departmentId: departmentResult.insertedId,
        departmentName: 'Computer Science',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'faculty1@lords.ac.in',
        password: facultyPassword,
        role: 'Faculty',
        name: 'Faculty One',
        departmentId: departmentResult.insertedId,
        departmentName: 'Computer Science',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const userResult = await usersCollection.insertMany(users);
    console.log(`Created ${userResult.insertedCount} users`);
    
    // Create indexes
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await departmentsCollection.createIndex({ name: 1 }, { unique: true });
    await departmentsCollection.createIndex({ code: 1 }, { unique: true });
    
    console.log('Database setup completed successfully');
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

run().catch(console.error);
