import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PrincipalRemarks from '@/models/PrincipalRemarks';
import HodAppraisal from '@/models/HodAppraisal';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import { getServerCurrentUser } from '@/lib/auth';

// Get Principal remarks
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
    
    // Query parameters
    const searchParams = req.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');
    const facultyId = searchParams.get('facultyId');
    const departmentId = searchParams.get('departmentId');
    
    let query: any = {};
    
    // Apply filters
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    if (facultyId) {
      query.facultyId = facultyId;
    }
    
    if (departmentId) {
      query.departmentId = departmentId;
    }
    
    // Role-based access control
    if (currentUser.role === 'Faculty') {
      // Faculty can only see their own remarks
      query.facultyId = currentUser.userId;
    } else if (currentUser.role === 'HOD') {
      // HOD can see remarks in their department
      query.departmentId = currentUser.departmentId;
    }
    // Principal can see all remarks with optional filters
    
    // Get remarks
    const remarks = await PrincipalRemarks.find(query);
    
    return NextResponse.json({ remarks });
  } catch (error) {
    console.error('Get Principal remarks error:', error);
    return NextResponse.json(
      { error: 'Failed to get Principal remarks' },
      { status: 500 }
    );
  }
}

// Create or update Principal remarks
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
    
    // Only Principal can create/update remarks
    if (currentUser.role !== 'Principal') {
      return NextResponse.json(
        { error: 'Only Principal can submit remarks' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const remarksData = await req.json();
    
    // Validate input
    if (!remarksData.facultyId || !remarksData.academicYear || !remarksData.selfAppraisalId || !remarksData.hodAppraisalId) {
      return NextResponse.json(
        { error: 'Faculty ID, academic year, self-appraisal ID, and HOD appraisal ID are required' },
        { status: 400 }
      );
    }
    
    // Check if HOD appraisal exists and is submitted to principal
    const hodAppraisal = await HodAppraisal.findById(remarksData.hodAppraisalId);
    
    if (!hodAppraisal) {
      return NextResponse.json(
        { error: 'HOD appraisal not found' },
        { status: 404 }
      );
    }
    
    if (hodAppraisal.status !== 'submitted_to_principal') {
      return NextResponse.json(
        { error: 'HOD appraisal has not been submitted to Principal' },
        { status: 400 }
      );
    }
    
    // Check if Principal remarks already exist
    let principalRemarks = await PrincipalRemarks.findOne({
      facultyId: remarksData.facultyId,
      academicYear: remarksData.academicYear
    });
    
    // Set faculty and department info from HOD appraisal
    remarksData.facultyName = hodAppraisal.facultyName;
    remarksData.departmentId = hodAppraisal.departmentId;
    remarksData.departmentName = hodAppraisal.departmentName;
    
    if (principalRemarks) {
      // Update existing remarks
      // Only allow updates if status is 'draft'
      if (principalRemarks.status !== 'draft') {
        return NextResponse.json(
          { error: 'Cannot update completed remarks' },
          { status: 400 }
        );
      }
      
      // Update remarks
      principalRemarks = await PrincipalRemarks.findByIdAndUpdate(
        principalRemarks._id,
        { $set: remarksData },
        { new: true }
      );
    } else {
      // Create new remarks
      principalRemarks = new PrincipalRemarks(remarksData);
      await principalRemarks.save();
    }
    
    // Update HOD appraisal and self-appraisal status if Principal remarks are completed
    if (remarksData.status === 'completed') {
      await HodAppraisal.findByIdAndUpdate(
        hodAppraisal._id,
        { status: 'completed' }
      );
      
      await FacultySelfAppraisal.findByIdAndUpdate(
        remarksData.selfAppraisalId,
        { status: 'completed' }
      );
    }
    
    return NextResponse.json({ remarks: principalRemarks });
  } catch (error) {
    console.error('Create/update Principal remarks error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update Principal remarks' },
      { status: 500 }
    );
  }
}