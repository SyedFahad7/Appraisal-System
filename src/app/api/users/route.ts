import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getServerCurrentUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Get all users (filtered by department for HOD)
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = getServerCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Filter query
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role');
    const departmentId = searchParams.get('departmentId');
    
    let query: any = {};
    
    // Apply filters
    if (role) {
      query.role = role;
    }
    
    // For HOD, restrict to their department
    if (currentUser.role === 'HOD') {
      query.departmentId = currentUser.departmentId;
    } 
    // For Principal, filter by department if specified
    else if (currentUser.role === 'Principal' && departmentId) {
      query.departmentId = departmentId;
    }
    
    // Faculty can't access this endpoint
    if (currentUser.role === 'Faculty') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Get users
    const users = await User.find(query).select('-password');
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

// Create new user (HOD can create faculty, Principal can create HOD and faculty)
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = getServerCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const userData = await req.json();
    
    // Validate input
    if (!userData.email || !userData.password || !userData.name || !userData.role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if email is from lords.ac.in domain
    if (!userData.email.endsWith('@lords.ac.in')) {
      return NextResponse.json(
        { error: 'Only LORDS Institute email addresses are allowed' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Role-based permissions
    if (currentUser.role === 'HOD') {
      // HOD can only create Faculty users in their department
      if (userData.role !== 'Faculty') {
        return NextResponse.json(
          { error: 'HOD can only create Faculty users' },
          { status: 403 }
        );
      }
      
      // Set department to HOD's department
      userData.departmentId = currentUser.departmentId;
      userData.departmentName = currentUser.department?.name;
    } else if (currentUser.role === 'Principal') {
      // Principal can create HOD and Faculty users
      if (userData.role === 'Principal') {
        return NextResponse.json(
          { error: 'Principal cannot create other Principal users' },
          { status: 403 }
        );
      }
      
      // Department is required for HOD and Faculty
      if (!userData.departmentId) {
        return NextResponse.json(
          { error: 'Department is required for HOD and Faculty users' },
          { status: 400 }
        );
      }
    } else {
      // Faculty cannot create users
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Create user
    const newUser = new User(userData);
    await newUser.save();
    
    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        departmentId: newUser.departmentId,
        departmentName: newUser.departmentName
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}