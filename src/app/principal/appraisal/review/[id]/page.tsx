'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function PrincipalAppraisalReview({ params }: { params: { id: string } }) {
  const router = useRouter();
  const appraisalId = params.id;
  const [user, setUser] = useState<any>(null);
  const [faculty, setFaculty] = useState<any>(null);
  const [selfAppraisal, setSelfAppraisal] = useState<any>(null);
  const [hodAppraisal, setHodAppraisal] = useState<any>(null);
  const [principalRemarks, setPrincipalRemarks] = useState<any>({
    observations: '',
    recommendations: '',
    principalSignature: {
      signed: false,
      principalName: '',
      signatureDate: new Date()
    },
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(async () => {
    // Check if user is authenticated and is Principal
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Principal') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Fetch appraisal details
    const fetchAppraisalDetails = async () => {
      try {
        // Fetch HOD appraisal
        const hodResponse = await fetch(`/api/appraisals/hod/${appraisalId}`);
        if (!hodResponse.ok) throw new Error('Failed to fetch HOD appraisal');
        const hodData = await hodResponse.json();
        setHodAppraisal(hodData);
        
        // Fetch faculty details
        const userResponse = await fetch(`/api/users/${hodData.facultyId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch faculty details');
        const facultyData = await userResponse.json();
        setFaculty(facultyData);
        
        // Fetch faculty self-appraisal
        const selfAppraisalResponse = await fetch(`/api/appraisals/self/${hodData.selfAppraisalId}`);
        if (!selfAppraisalResponse.ok) throw new Error('Failed to fetch self-appraisal');
        const selfAppraisalData = await selfAppraisalResponse.json();
        setSelfAppraisal(selfAppraisalData);
        
        // Fetch existing Principal remarks if any
        const principalRemarksResponse = await fetch(`/api/appraisals/principal?hodAppraisalId=${appraisalId}`);
        if (principalRemarksResponse.ok) {
          const principalRemarksData = await principalRemarksResponse.json();
          if (principalRemarksData && principalRemarksData.length > 0) {
            setPrincipalRemarks(principalRemarksData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load appraisal data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppraisalDetails();
  }, [appraisalId, router]);
  
  const handleInputChange = (field: string, value: string) => {
    setPrincipalRemarks((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...principalRemarks,
        facultyId: hodAppraisal.facultyId,
        facultyName: hodAppraisal.facultyName,
        departmentId: hodAppraisal.departmentId,
        departmentName: hodAppraisal.departmentName,
        academicYear: hodAppraisal.academicYear,
        selfAppraisalId: hodAppraisal.selfAppraisalId,
        hodAppraisalId: hodAppraisal._id,
        principalSignature: {
          signed: true,
          principalName: user?.name,
          signatureDate: new Date()
        },
        status: 'completed',
        completionDate: new Date()
      };
      
      // Submit to API
      const response = await fetch('/api/appraisals/principal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit remarks');
      }
      
      setSuccess('Remarks submitted successfully');
      setTimeout(() => {
        router.push('/principal/appraisal/review');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting remarks:', error);
      setError(error.message || 'Failed to submit remarks');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!hodAppraisal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Appraisal not found or not submitted by HOD yet.</p>
          <button 
            onClick={() => router.push('/principal')}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">PERFORMANCE APPRAISAL ON FACULTY</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-semibold">Name of the Faculty Member:</p>
            <p>{hodAppraisal.facultyName}</p>
          </div>
          <div>
            <p className="font-semibold">Department:</p>
            <p>{hodAppraisal.departmentName}</p>
          </div>
        </div>
      </div>
      
      {/* Display HOD's Assessment */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-center">HOD's Assessment</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <tbody>
              <tr>
                <td className="py-2 px-4 border font-medium">Faculty's Self Assessment Score:</td>
                <td className="py-2 px-4 border">{selfAppraisal?.totalScore || 0} / 375</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border font-medium">HOD's Assessment Score:</td>
                <td className="py-2 px-4 border">
                  {Object.values(hodAppraisal.assessment || {}).reduce((sum: number, value: any) => {
                    return typeof value === 'number' ? sum + value : sum;
                  }, 0)} / 25
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border font-medium">Performance (Weighted Score):</td>
                <td className="py-2 px-4 border">{hodAppraisal.performanceScore?.weightedScore || 0} / 100</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border font-medium">Performance Category:</td>
                <td className="py-2 px-4 border">{hodAppraisal.performanceScore?.category || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">HOD's Suggestions for Improvement:</h3>
          <div className="p-4 border rounded bg-gray-50">
            <p>{hodAppraisal.suggestionsForImprovement || 'No suggestions provided.'}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">HOD's Signature:</h3>
          <p>{hodAppraisal.hodSignature?.hodName || 'Not signed'}</p>
          <p className="text-sm text-gray-500">
            {hodAppraisal.hodSignature?.signatureDate ? 
              new Date(hodAppraisal.hodSignature.signatureDate).toLocaleDateString() : ''}
          </p>
        </div>
      </div>
      
      {/* Principal's Remarks Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">Principal's Observations and Remarks</h2>
          
          <div className="mb-6">
            <label className="block font-medium mb-2">Observations:</label>
            <textarea 
              value={principalRemarks.observations} 
              onChange={(e) => handleInputChange('observations', e.target.value)} 
              className="w-full p-2 border rounded h-32"
              placeholder="Enter your observations"
              required
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block font-medium mb-2">Recommendations:</label>
            <textarea 
              value={principalRemarks.recommendations} 
              onChange={(e) => handleInputChange('recommendations', e.target.value)} 
              className="w-full p-2 border rounded h-32"
              placeholder="Enter your recommendations"
              required
            ></textarea>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">Principal's Signature:</p>
                <p className="mt-2">{user?.name}</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="principalSignature" 
                  checked={principalRemarks.principalSignature?.signed} 
                  onChange={(e) => setPrincipalRemarks((prev: any) => ({
                     ...prev,
                     principalSignature: {
                       ...prev.principalSignature,
                       signed: e.target.checked,
                       principalName: user?.name || '',
                       signatureDate: new Date()
                     }
                   }))} 
                  className="mr-2"
                  required
                />
                <label htmlFor="principalSignature">I digitally sign this appraisal</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            type="button" 
            onClick={() => router.push('/principal/appraisal/review')} 
            className="bg-gray-500 text-white py-2 px-6 rounded mr-4 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving || !principalRemarks.principalSignature?.signed} 
            className={`bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 ${(saving || !principalRemarks.principalSignature?.signed) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Submitting...' : 'Submit Remarks'}
          </button>
        </div>
      </form>
    </div>
  );
}