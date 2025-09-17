'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function PrincipalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalDepartments: 0,
    pendingAppraisals: 0,
    completedAppraisals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
    // Check if user is authenticated and is Principal
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Principal') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
      try {
        // Fetch faculty count
        const facultyResponse = await fetch('/api/users?role=Faculty');
        if (!facultyResponse.ok) throw new Error('Failed to fetch faculty data');
        const facultyData = await facultyResponse.json();
        
        // Fetch departments
        const departmentsResponse = await fetch('/api/departments');
        if (!departmentsResponse.ok) throw new Error('Failed to fetch departments');
        const departmentsData = await departmentsResponse.json();
        
        // Fetch HOD appraisals that need principal review
        const pendingAppraisalsResponse = await fetch('/api/analytics/appraisals/pending?role=Principal');
        if (!pendingAppraisalsResponse.ok) throw new Error('Failed to fetch pending appraisals');
        const pendingAppraisalsData = await pendingAppraisalsResponse.json();
        
        // Fetch completed principal reviews
        const completedAppraisalsResponse = await fetch('/api/analytics/appraisals/completed?role=Principal');
        if (!completedAppraisalsResponse.ok) throw new Error('Failed to fetch completed appraisals');
        const completedAppraisalsData = await completedAppraisalsResponse.json();
        
        setStats({
          totalFaculty: facultyData.length || 0,
          totalDepartments: departmentsData.length || 0,
          pendingAppraisals: pendingAppraisalsData.count || 0,
          completedAppraisals: completedAppraisalsData.count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
      fetchDashboardStats();
    };
    
    fetchData();
  }, [router]);
  
  const navigateTo = (path: string) => {
    router.push(path);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">Principal Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Total Faculty</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.totalFaculty}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Departments</h2>
          <p className="text-4xl font-bold text-green-600">{stats.totalDepartments}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Pending Reviews</h2>
          <p className="text-4xl font-bold text-yellow-600">{stats.pendingAppraisals}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Completed Reviews</h2>
          <p className="text-4xl font-bold text-purple-600">{stats.completedAppraisals}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Appraisal Management</h2>
          <div className="space-y-4">
            <button 
              onClick={() => navigateTo('/principal/appraisal/review')} 
              className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 flex items-center justify-between"
            >
              <span>Review Faculty Appraisals</span>
              <span>→</span>
            </button>
            
            <button 
              onClick={() => navigateTo('/reports')} 
              className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 flex items-center justify-between"
            >
              <span>View Appraisal Reports</span>
              <span>→</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Institution Management</h2>
          <div className="space-y-4">
            <button 
              onClick={() => navigateTo('/departments')} 
              className="w-full bg-purple-600 text-white py-3 px-4 rounded hover:bg-purple-700 flex items-center justify-between"
            >
              <span>Manage Departments</span>
              <span>→</span>
            </button>
            
            <button 
              onClick={() => navigateTo('/users')} 
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded hover:bg-indigo-700 flex items-center justify-between"
            >
              <span>Manage Users</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigateTo('/settings')} 
            className="bg-gray-200 hover:bg-gray-300 py-3 px-4 rounded flex items-center justify-center"
          >
            Settings
          </button>
          
          <button 
            onClick={() => navigateTo('/profile')} 
            className="bg-gray-200 hover:bg-gray-300 py-3 px-4 rounded flex items-center justify-center"
          >
            My Profile
          </button>
          
          <button 
            onClick={() => navigateTo('/api/auth/logout')} 
            className="bg-red-100 text-red-700 hover:bg-red-200 py-3 px-4 rounded flex items-center justify-center"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}