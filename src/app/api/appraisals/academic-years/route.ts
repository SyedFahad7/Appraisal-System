import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import { getCurrentUser } from '@/lib/auth';

// Get all academic years from appraisals
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Aggregate to get unique academic years
    const academicYears = await FacultySelfAppraisal.distinct('academicYear');
    
    // Sort academic years in descending order (most recent first)
    academicYears.sort((a, b) => {
      // Assuming format like "2023-2024"
      return b.localeCompare(a);
    });
    
    return NextResponse.json(academicYears);
  } catch (error) {
    console.error('Get academic years error:', error);
    return NextResponse.json(
      { error: 'Failed to get academic years' },
      { status: 500 }
    );
  }
}