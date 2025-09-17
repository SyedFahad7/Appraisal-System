'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function HodAppraisalReview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  
  useEffect(() => {
    const fetchData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'HOD') {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Fetch appraisals
      try {
        const response = await fetch(`/api/appraisals/hod?academicYear=${academicYear}`);
        if (!response.ok) {
          throw new Error('Failed to fetch appraisals');
        }
        const data = await response.json();
        setAppraisals(data.appraisals);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [academicYear, router]);
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAcademicYear(e.target.value);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Faculty Appraisal Review</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Department: {user?.departmentName}</h2>
          </div>
          <div className="flex items-center">
            <label htmlFor="academicYear" className="mr-2">Academic Year:</label>
            <select
              id="academicYear"
              value={academicYear}
              onChange={handleYearChange}
              className="border rounded p-2"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year.toString()}>
                    {year}-{year + 1}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        {appraisals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Faculty Name</th>
                  <th className="py-2 px-4 border-b">Self-Appraisal Score</th>
                  <th className="py-2 px-4 border-b">HOD Assessment</th>
                  <th className="py-2 px-4 border-b">Weighted Score</th>
                  <th className="py-2 px-4 border-b">Performance Category</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appraisals.map((appraisal) => (
                  <tr key={appraisal._id}>
                    <td className="py-2 px-4 border-b">{appraisal.facultyName}</td>
                    <td className="py-2 px-4 border-b text-center">{appraisal.selfAppraisalScore || '-'}</td>
                    <td className="py-2 px-4 border-b text-center">
                      {Object.values(appraisal.assessment || {}).reduce((sum: number, value: any) => {
                        return typeof value === 'number' ? sum + value : sum;
                      }, 0)}
                    </td>
                    <td className="py-2 px-4 border-b text-center">{appraisal.performanceScore?.weightedScore || '-'}</td>
                    <td className="py-2 px-4 border-b text-center">{appraisal.performanceScore?.category || '-'}</td>
                    <td className="py-2 px-4 border-b text-center">
                      {appraisal.hodSignature?.signed ? (
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs">Completed</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full text-xs">In Progress</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => router.push(`/hod/appraisal/${appraisal.facultyId}`)}
                        className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
                      >
                        {appraisal.hodSignature?.signed ? 'View' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No appraisals found for the selected academic year.</p>
            <button
              onClick={() => router.push('/hod')}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}