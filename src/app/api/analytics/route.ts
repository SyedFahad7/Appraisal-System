import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import HodAppraisal from '@/models/HodAppraisal';
import User from '@/models/User';
import Department from '@/models/Department';
import { getCurrentUser } from '@/lib/auth';

// Get analytics data
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
    
    // Only Principal and HOD can access analytics
    if (currentUser.role !== 'Principal' && currentUser.role !== 'HOD') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Query parameters
    const searchParams = req.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear');
    const departmentId = searchParams.get('departmentId');
    
    let query: any = {};
    
    // Apply filters
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    // HOD can only see their department
    if (currentUser.role === 'HOD') {
      query.departmentId = currentUser.departmentId;
    } 
    // Principal can filter by department
    else if (departmentId) {
      query.departmentId = departmentId;
    }
    
    // Get all departments (for Principal)
    const departments = currentUser.role === 'Principal' 
      ? await Department.find() 
      : [await Department.findById(currentUser.departmentId)];
    
    // Get all appraisals matching query
    const appraisals = await HodAppraisal.find(query);
    
    // Calculate analytics
    const analytics = {
      totalAppraisals: appraisals.length,
      departmentBreakdown: [] as any[],
      performanceCategories: {
        'Below Average': 0,
        'Average': 0,
        'Good': 0,
        'Very Good': 0,
        'Excellent': 0
      },
      averageScore: 0
    };
    
    // Calculate total score
    let totalScore = 0;
    
    // Count performance categories
    appraisals.forEach(appraisal => {
      if (appraisal.performanceScore?.category) {
        analytics.performanceCategories[appraisal.performanceScore.category]++;
      }
      
      if (appraisal.performanceScore?.weightedScore) {
        totalScore += appraisal.performanceScore.weightedScore;
      }
    });
    
    // Calculate average score
    analytics.averageScore = appraisals.length > 0 
      ? Math.round((totalScore / appraisals.length) * 100) / 100 
      : 0;
    
    // Calculate department breakdown
    for (const department of departments) {
      const departmentAppraisals = appraisals.filter(
        appraisal => department && appraisal.departmentId.toString() === (department._id as ObjectId).toString()
        appraisal => department && appraisal.departmentId.toString() === (department._id as any).toString()
      );
      
      let departmentTotalScore = 0;
      departmentAppraisals.forEach(appraisal => {
        if (appraisal.performanceScore?.weightedScore) {
          departmentTotalScore += appraisal.performanceScore.weightedScore;
        }
      });
      
      const departmentAverageScore = departmentAppraisals.length > 0 
        ? Math.round((departmentTotalScore / departmentAppraisals.length) * 100) / 100 
        : 0;
      
      analytics.departmentBreakdown.push({
        departmentId: department?._id,
        departmentName: department?.name,
        totalAppraisals: departmentAppraisals.length,
        averageScore: departmentAverageScore,
        performanceCategories: {
          'Below Average': departmentAppraisals.filter(a => a.performanceScore?.category === 'Below Average').length,
          'Average': departmentAppraisals.filter(a => a.performanceScore?.category === 'Average').length,
          'Good': departmentAppraisals.filter(a => a.performanceScore?.category === 'Good').length,
          'Very Good': departmentAppraisals.filter(a => a.performanceScore?.category === 'Very Good').length,
          'Excellent': departmentAppraisals.filter(a => a.performanceScore?.category === 'Excellent').length
        }
      });
    }
    
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
