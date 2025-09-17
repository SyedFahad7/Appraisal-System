import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import HodAppraisal from '@/models/HodAppraisal';
import { getCurrentUser } from '@/lib/auth';

// Get count of pending appraisals based on role
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
    
    // Get role from query params
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role');
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      );
    }
    
    let count = 0;
    
    // Get pending appraisals based on role
    if (role === 'HOD') {
      // For HOD: Count self-appraisals submitted by faculty but not yet reviewed by HOD
      count = await FacultySelfAppraisal.countDocuments({ 
        status: 'submitted_to_hod',
        departmentId: currentUser.departmentId
      });
    } else if (role === 'Principal') {
      // For Principal: Count HOD appraisals submitted to principal but not yet reviewed
      count = await HodAppraisal.countDocuments({ 
        status: 'submitted_to_principal'
      });
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get pending appraisals count error:', error);
    return NextResponse.json(
      { error: 'Failed to get pending appraisals count' },
      { status: 500 }
    );
  }
}