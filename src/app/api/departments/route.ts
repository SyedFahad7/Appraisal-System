import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Department from '@/models/Department';
import { getCurrentUser } from '@/lib/auth';

// Get all departments
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get departments
    const departments = await Department.find();
    
    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { error: 'Failed to get departments' },
      { status: 500 }
    );
  }
}

// Create new department (Principal only)
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only Principal can create departments
    if (currentUser.role !== 'Principal') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const departmentData = await req.json();
    
    // Validate input
    if (!departmentData.name || !departmentData.code) {
      return NextResponse.json(
        { error: 'Department name and code are required' },
        { status: 400 }
      );
    }
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: departmentData.name },
        { code: departmentData.code }
      ]
    });
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name or code already exists' },
        { status: 400 }
      );
    }
    
    // Create department
    const newDepartment = new Department(departmentData);
    await newDepartment.save();
    
    return NextResponse.json({ department: newDepartment }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
