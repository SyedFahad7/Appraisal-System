'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function PrincipalAppraisalReviewList() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(async () => {
    // Check if user is authenticated and is Principal
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Principal') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Fetch academic years
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch('/api/appraisals/academic-years');
        if (!response.ok) throw new Error('Failed to fetch academic years');
        const data = await response.json();
        setAcademicYears(data);
        
        // Set the most recent academic year as default
        if (data.length > 0) {
          setSelectedYear(data[0]);
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        setError('Failed to load academic years');
      }
    };
    
    fetchAcademicYears();
  }, [router]);
  
  useEffect(() => {
    // Fetch appraisals when academic year is selected
    if (selectedYear) {
      fetchAppraisals(selectedYear);
    }
  }, [selectedYear]);
  
  const fetchAppraisals = async (academicYear: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/appraisals/hod?academicYear=${academicYear}&status=completed`);
      if (!response.ok) throw new Error('Failed to fetch appraisals');
      const hodAppraisals = await response.json();
      
      // Fetch principal remarks to check which ones have already been reviewed
      const principalRemarksResponse = await fetch(`/api/appraisals/principal?academicYear=${academicYear}`);
      const principalRemarks = principalRemarksResponse.ok ? await principalRemarksResponse.json() : [];
      
      // Map principal remarks to HOD appraisals
      const appraisalsWithStatus = hodAppraisals.map((appraisal: any) => {
        const principalRemark = principalRemarks.find((remark: any) => 
          remark.hodAppraisalId === appraisal._id
        );
        
        return {
          ...appraisal,
          principalReviewStatus: principalRemark ? principalRemark.status : 'pending',
          principalRemarkId: principalRemark ? principalRemark._id : null
        };
      });
      
      setAppraisals(appraisalsWithStatus);
    } catch (error) {
      console.error('Error fetching appraisals:', error);
      setError('Failed to load appraisals');
    } finally {
      setLoading(false);
    }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };
  
  const handleViewAppraisal = (appraisalId: string) => {
    router.push(`/principal/appraisal/review/${appraisalId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">Faculty Appraisal Review</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-bold mb-4 md:mb-0">Appraisals Pending Review</h2>
          
          <div className="flex items-center">
            <label htmlFor="academicYear" className="mr-2">Academic Year:</label>
            <select
              id="academicYear"
              value={selectedYear}
              onChange={handleYearChange}
              className="border rounded p-2"
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">Loading...</div>
        ) : appraisals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appraisals found for the selected academic year.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Faculty Name</th>
                  <th className="py-2 px-4 border">Department</th>
                  <th className="py-2 px-4 border">Designation</th>
                  <th className="py-2 px-4 border">HOD Score</th>
                  <th className="py-2 px-4 border">Performance Category</th>
                  <th className="py-2 px-4 border">Status</th>
                  <th className="py-2 px-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appraisals.map((appraisal) => (
                  <tr key={appraisal._id}>
                    <td className="py-2 px-4 border">{appraisal.facultyName}</td>
                    <td className="py-2 px-4 border">{appraisal.departmentName}</td>
                    <td className="py-2 px-4 border">{appraisal.designation || '-'}</td>
                    <td className="py-2 px-4 border">
                      {Object.values(appraisal.assessment || {}).reduce((sum: number, value: any) => {
                        return typeof value === 'number' ? sum + value : sum;
                      }, 0)} / 25
                    </td>
                    <td className="py-2 px-4 border">{appraisal.performanceScore?.category || '-'}</td>
                    <td className="py-2 px-4 border">
                      <span className={`px-2 py-1 rounded text-xs ${appraisal.principalReviewStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {appraisal.principalReviewStatus === 'completed' ? 'Reviewed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() => handleViewAppraisal(appraisal._id)}
                        className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                      >
                        {appraisal.principalReviewStatus === 'completed' ? 'View' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={() => router.push('/principal')} 
          className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}