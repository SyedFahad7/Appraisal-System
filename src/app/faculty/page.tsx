'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, removeCurrentUser } from '@/lib/auth';

export default function FacultyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'Faculty') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setLoading(false);
  }, [router]);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      removeCurrentUser();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome</h2>
          <p className="mb-2"><span className="font-medium">Name:</span> {user?.name}</p>
          <p className="mb-2"><span className="font-medium">Email:</span> {user?.email}</p>
          <p className="mb-2"><span className="font-medium">Role:</span> {user?.role}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => router.push('/faculty/appraisal/form')}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Submit Self-Appraisal
            </button>
            <button 
              onClick={() => router.push('/faculty/appraisal/status')}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              View Appraisal Status
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <button 
            onClick={() => router.push('/profile')}
            className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 w-full"
          >
            Update Profile
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Appraisal Information</h2>
        <p className="text-gray-600 mb-4">
          The faculty appraisal system allows you to submit your annual performance evaluation. 
          Please ensure all sections are completed accurately and supporting documents are uploaded.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Current Academic Year</h3>
            <p className="text-2xl font-bold text-blue-600">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Submission Deadline</h3>
            <p className="text-2xl font-bold text-red-600">March 31, {new Date().getFullYear() + 1}</p>
          </div>
        </div>
      </div>
    </div>
  );
}