import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import HodAppraisal from '@/models/HodAppraisal';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import User from '@/models/User';
import { getServerCurrentUser } from '@/lib/auth';

// Get HOD appraisals
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
      // Faculty can only see their own appraisals
      query.facultyId = currentUser.userId;
    } else if (currentUser.role === 'HOD') {
      // HOD can see appraisals in their department
      query.departmentId = currentUser.departmentId;
    }
    // Principal can see all appraisals with optional filters
    
    // Get appraisals
    const appraisals = await HodAppraisal.find(query);
    
    return NextResponse.json({ appraisals });
  } catch (error) {
    console.error('Get HOD appraisals error:', error);
    return NextResponse.json(
      { error: 'Failed to get HOD appraisals' },
      { status: 500 }
    );
  }
}

// Create or update HOD appraisal
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
    
    // Only HOD can create/update appraisals
    if (currentUser.role !== 'HOD') {
      return NextResponse.json(
        { error: 'Only HOD can submit faculty appraisals' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const appraisalData = await req.json();
    
    // Validate input
    if (!appraisalData.facultyId || !appraisalData.academicYear || !appraisalData.selfAppraisalId) {
      return NextResponse.json(
        { error: 'Faculty ID, academic year, and self-appraisal ID are required' },
        { status: 400 }
      );
    }
    
    // Check if faculty exists and is in HOD's department
    const faculty = await User.findById(appraisalData.facultyId);
    
    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }
    
    if (faculty.departmentId?.toString() !== currentUser.departmentId?.toString()) {
      return NextResponse.json(
        { error: 'Faculty is not in your department' },
        { status: 403 }
      );
    }
    
    // Check if self-appraisal exists and is submitted
    const selfAppraisal = await FacultySelfAppraisal.findById(appraisalData.selfAppraisalId);
    
    if (!selfAppraisal) {
      return NextResponse.json(
        { error: 'Self-appraisal not found' },
        { status: 404 }
      );
    }
    
    if (selfAppraisal.status === 'draft') {
      return NextResponse.json(
        { error: 'Cannot review a draft self-appraisal' },
        { status: 400 }
      );
    }
    
    // Check if HOD appraisal already exists
    let hodAppraisal = await HodAppraisal.findOne({
      facultyId: appraisalData.facultyId,
      academicYear: appraisalData.academicYear
    });
    
    // Set department info
    appraisalData.departmentId = currentUser.departmentId;
    appraisalData.departmentName = faculty.departmentName;
    appraisalData.facultyName = faculty.name;
    
    // Calculate weighted score if assessment data is provided
    if (appraisalData.assessment && appraisalData.weightage) {
      const assessment = appraisalData.assessment;
      const weightage = appraisalData.weightage;
      
      // Calculate total assessment score (out of 25)
      const totalAssessmentScore = (
        (assessment.initiativeAndDrive || 0) +
        (assessment.availingOfLeavePermissions || 0) +
        (assessment.domainKnowledge || 0) +
        (assessment.efficacyOfStudentMentoring || 0) +
        (assessment.administrativeEfficiency || 0) +
        (assessment.complianceOfInstitutionalPolicies || 0) +
        (assessment.collegialityAndTeamwork || 0) +
        (assessment.classControlAndInnovation || 0) +
        (assessment.timelyCompletionOfTasks || 0) +
        (assessment.attireAppearanceAndPunctuality || 0)
      ) / 10; // Average of 10 criteria
      
      // Calculate weighted score (out of 100)
      const selfAssessmentScore = selfAppraisal.selfAssessment?.score || 0;
      const normalizedSelfScore = (selfAssessmentScore / 375) * 100; // Convert from 375 to 100 scale
      
      const weightedScore = (
        (normalizedSelfScore * 0.75) + // Self-assessment is 75% of total
        (totalAssessmentScore * 0.25)  // HOD assessment is 25% of total
      );
      
      // Determine performance category
      let category = '';
      if (weightedScore < 60) category = 'Below Average';
      else if (weightedScore < 70) category = 'Average';
      else if (weightedScore < 80) category = 'Good';
      else if (weightedScore < 90) category = 'Very Good';
      else category = 'Excellent';
      
      // Set performance score
      appraisalData.performanceScore = {
        weightedScore: Math.round(weightedScore * 100) / 100, // Round to 2 decimal places
        category
      };
    }
    
    if (hodAppraisal) {
      // Update existing appraisal
      // Only allow updates if status is 'draft'
      if (hodAppraisal.status !== 'draft') {
        return NextResponse.json(
          { error: 'Cannot update submitted appraisal' },
          { status: 400 }
        );
      }
      
      // Update appraisal
      hodAppraisal = await HodAppraisal.findByIdAndUpdate(
        hodAppraisal._id,
        { $set: appraisalData },
        { new: true }
      );
    } else {
      // Create new appraisal
      hodAppraisal = new HodAppraisal(appraisalData);
      await hodAppraisal.save();
    }
    
    // Update self-appraisal status if HOD appraisal is submitted
    if (appraisalData.status === 'submitted_to_principal') {
      await FacultySelfAppraisal.findByIdAndUpdate(
        selfAppraisal._id,
        { status: 'reviewed_by_hod' }
      );
    }
    
    return NextResponse.json({ appraisal: hodAppraisal });
  } catch (error) {
    console.error('Create/update HOD appraisal error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update HOD appraisal' },
      { status: 500 }
    );
  }
}