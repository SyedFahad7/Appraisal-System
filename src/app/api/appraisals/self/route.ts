import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// Get faculty self-appraisals
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
    
    // Query parameters
    const searchParams = req.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');
    const facultyId = searchParams.get('facultyId');
    
    let query: any = {};
    
    // Apply filters
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    // Role-based access control
    if (currentUser.role === 'Faculty') {
      // Faculty can only see their own appraisals
      query.facultyId = currentUser.userId;
    } else if (currentUser.role === 'HOD') {
      // HOD can see appraisals in their department
      if (facultyId) {
        // If specific faculty is requested, check if they're in HOD's department
        const faculty = await User.findById(facultyId);
        
        if (!faculty || faculty.departmentId?.toString() !== currentUser.departmentId?.toString()) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
        
        query.facultyId = facultyId;
      } else {
        // Otherwise, get all appraisals in HOD's department
        query.departmentId = currentUser.departmentId;
      }
    } else if (currentUser.role === 'Principal') {
      // Principal can see all appraisals or filter by faculty
      if (facultyId) {
        query.facultyId = facultyId;
      }
    }
    
    // Get appraisals
    const appraisals = await FacultySelfAppraisal.find(query);
    
    return NextResponse.json({ appraisals });
  } catch (error) {
    console.error('Get appraisals error:', error);
    return NextResponse.json(
      { error: 'Failed to get appraisals' },
      { status: 500 }
    );
  }
}

// Create or update faculty self-appraisal
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
    
    // Only Faculty can create/update their own appraisal
    if (currentUser.role !== 'Faculty') {
      return NextResponse.json(
        { error: 'Only Faculty can submit self-appraisals' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const appraisalData = await req.json();
    
    // Validate input
    if (!appraisalData.academicYear) {
      return NextResponse.json(
        { error: 'Academic year is required' },
        { status: 400 }
      );
    }
    
    // Check if appraisal already exists for this faculty and academic year
    let appraisal = await FacultySelfAppraisal.findOne({
      facultyId: currentUser.userId,
      academicYear: appraisalData.academicYear
    });
    
    // Set faculty and department info
    appraisalData.facultyId = currentUser.userId;
    appraisalData.facultyName = currentUser.name;
    appraisalData.departmentId = currentUser.departmentId;
    
    // Get department name
    const faculty = await User.findById(currentUser.userId);
    appraisalData.departmentName = faculty?.departmentName || '';
    
    if (appraisal) {
      // Update existing appraisal
      // Only allow updates if status is 'draft'
      if (appraisal.status !== 'draft') {
        return NextResponse.json(
          { error: 'Cannot update submitted appraisal' },
          { status: 400 }
        );
      }
      
      // Update appraisal
      appraisal = await FacultySelfAppraisal.findByIdAndUpdate(
        appraisal._id,
        { $set: appraisalData },
        { new: true }
      );
    } else {
      // Create new appraisal
      appraisal = new FacultySelfAppraisal(appraisalData);
      await appraisal.save();
    }
    
    return NextResponse.json({ appraisal });
  } catch (error) {
    console.error('Create/update appraisal error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update appraisal' },
      { status: 500 }
    );
  }
}
