import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FacultySelfAppraisal from '@/models/FacultySelfAppraisal';
import { getServerCurrentUser } from '@/lib/auth';

// Get all academic years from appraisals
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get current user from token
    const currentUser = getServerCurrentUser(req);
    
    if (!currentUser) {
    }