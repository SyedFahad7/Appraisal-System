import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';
import { existsSync } from 'fs';
import connectToDatabase from '@/lib/db';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';

// Handle file uploads
export async function POST(req: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only Faculty can upload files
    if (currentUser.role !== 'Faculty') {
      return NextResponse.json(
        { error: 'Only Faculty can upload files' },
        { status: 403 }
      );
    }
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const appraisalId = formData.get('appraisalId') as string;
    const section = formData.get('section') as string;
    
    // Validate input
    if (!file || !appraisalId || !section) {
      return NextResponse.json(
        { error: 'File, appraisal ID, and section are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if appraisal exists and belongs to current user
    const appraisal = await FacultySelfAppraisal.findById(appraisalId);
    
    if (!appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }
    
    if (appraisal.facultyId.toString() !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Only allow uploads for draft appraisals
    if (appraisal.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot upload files to submitted appraisal' },
        { status: 400 }
      );
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const userDir = join(uploadsDir, currentUser.userId);
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }
    
    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(userDir, fileName);
    
    // Save file
    await writeFile(filePath, buffer);
    
    // Add file to appraisal attachments
    const attachment = {
      fileName: originalName,
      fileType: file.type,
      filePath: `/uploads/${currentUser.userId}/${fileName}`,
      uploadDate: new Date(),
      section
    };
    
    // Update appraisal with new attachment
    appraisal.attachments.push(attachment);
    await appraisal.save();
    
    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
