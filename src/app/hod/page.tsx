'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function HodDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faculties, setFaculties] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'HOD') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Fetch faculties in the department
    try {
      const response = await fetch(`/api/users?departmentId=${currentUser.departmentId}&role=Faculty`);
      if (response.ok) {
        const data = await response.json();
        setFaculties(data.users);
      }
      } catch (error) {
        console.error('Error fetching faculties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">HOD Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Department Overview</h2>
          <p className="mb-2"><span className="font-medium">Department:</span> {user?.departmentName}</p>
          <p className="mb-2"><span className="font-medium">Faculty Count:</span> {faculties.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => router.push('/hod/appraisal/review')}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Review Faculty Appraisals
            </button>
            <button 
              onClick={() => router.push('/hod/faculty/manage')}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Manage Faculty
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Faculty Appraisals</h2>
        {faculties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Appraisal Status</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty: any) => (
                  <tr key={faculty._id}>
                    <td className="py-2 px-4 border-b">{faculty.name}</td>
                    <td className="py-2 px-4 border-b">{faculty.email}</td>
                    <td className="py-2 px-4 border-b">
                      {/* Status would come from API */}
                      Pending
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button 
                        onClick={() => router.push(`/hod/appraisal/${faculty._id}`)}
                        className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No faculty members found in your department.</p>
        )}
      </div>
    </div>
  );
}