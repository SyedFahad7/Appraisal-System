import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PrincipalRemarks from '@/models/PrincipalRemarks';
import HodAppraisal from '@/models/HodAppraisal';
import { getCurrentUser } from '@/lib/auth';

// Get count of completed appraisals based on role
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
    
    // Get completed appraisals based on role
    if (role === 'HOD') {
      // For HOD: Count appraisals completed by HOD
      count = await HodAppraisal.countDocuments({ 
        status: { $in: ['submitted_to_principal', 'completed'] },
        departmentId: currentUser.departmentId
      });
    } else if (role === 'Principal') {
      // For Principal: Count appraisals completed by Principal
      count = await PrincipalRemarks.countDocuments({ 
        status: 'completed'
      });
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get completed appraisals count error:', error);
    return NextResponse.json(
      { error: 'Failed to get completed appraisals count' },
      { status: 500 }
    );
  }
}