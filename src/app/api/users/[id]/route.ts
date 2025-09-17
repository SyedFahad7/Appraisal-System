import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Get user by ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
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
    
    const userId = params.id;
    
    // Get user
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    if (currentUser.role === 'Faculty' && currentUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' && 
        user.role !== 'Faculty' && 
        currentUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' &&
        user.departmentId?.toString() !== currentUser.departmentId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
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
    
    const userId = params.id;
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const userData = await req.json();
    
    // Check permissions
    if (currentUser.role === 'Faculty' && currentUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' && 
        user.role !== 'Faculty' && 
        currentUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' && 
        user.departmentId?.toString() !== currentUser.departmentId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Prevent role changes except by Principal
    if (userData.role && userData.role !== user.role && currentUser.role !== 'Principal') {
      return NextResponse.json(
        { error: 'Only Principal can change user roles' },
        { status: 403 }
      );
    }
    
    // Prevent department changes except by Principal
    if (userData.departmentId && 
        userData.departmentId !== user.departmentId?.toString() && 
        currentUser.role !== 'Principal') {
      return NextResponse.json(
        { error: 'Only Principal can change user departments' },
        { status: 403 }
      );
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userData },
      { new: true }
    ).select('-password');
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Reset user password
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
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
    
    const userId = params.id;
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const { currentPassword, newPassword } = await req.json();
    
    // Check if it's a self password change or admin reset
    if (currentUser.userId === userId) {
      // Self password change requires current password
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }
      
      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    } else {
      // Admin password reset
      // Check permissions
      if (currentUser.role === 'Faculty') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      if (currentUser.role === 'HOD' && user.role !== 'Faculty') {
        return NextResponse.json(
          { error: 'HOD can only reset Faculty passwords' },
          { status: 403 }
        );
      }
      
      if (currentUser.role === 'HOD' && 
          user.departmentId?.toString() !== currentUser.departmentId) {
        return NextResponse.json(
          { error: 'HOD can only reset passwords in their department' },
          { status: 403 }
        );
      }
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
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
    
    const userId = params.id;
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    if (currentUser.role === 'Faculty') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' && user.role !== 'Faculty') {
      return NextResponse.json(
        { error: 'HOD can only delete Faculty users' },
        { status: 403 }
      );
    }
    
    if (currentUser.role === 'HOD' && 
        user.departmentId?.toString() !== currentUser.departmentId) {
      return NextResponse.json(
        { error: 'HOD can only delete users in their department' },
        { status: 403 }
      );
    }
    
    // Prevent self-deletion
    if (currentUser.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}