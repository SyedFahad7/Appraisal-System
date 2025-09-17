'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function HodAppraisalForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const facultyId = params.id;
  const [user, setUser] = useState<any>(null);
  const [faculty, setFaculty] = useState<any>(null);
  const [selfAppraisal, setSelfAppraisal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  interface FormData {
    assessment: {
      initiativeAndDrive: number;
      availingOfLeavePermissions: number;
      domainKnowledge: number;
      efficacyOfStudentMentoring: number;
      administrativeEfficiency: number;
      complianceOfInstitutionalPolicies: number;
      collegialityAndTeamwork: number;
      classControlAndInnovation: number;
      timelyCompletionOfTasks: number;
      attireAppearanceAndPunctuality: number;
      showCauseNotices: string;
    };
    weightage: {
      teachingWeight: number;
      researchWeight: number;
      professionalDevelopmentWeight: number;
      administrationWeight: number;
    };
    performanceScore: {
      weightedScore: number;
      category: string;
    };
    hodRemarks: string;
    suggestionsForImprovement: string;
    hodSignature: {
      signed: boolean;
      hodName: string;
      signatureDate: Date;
    };
  }

  // Form state
  const [formData, setFormData] = useState<FormData>({
    assessment: {
      initiativeAndDrive: 0,
      availingOfLeavePermissions: 0,
      domainKnowledge: 0,
      efficacyOfStudentMentoring: 0,
      administrativeEfficiency: 0,
      complianceOfInstitutionalPolicies: 0,
      collegialityAndTeamwork: 0,
      classControlAndInnovation: 0,
      timelyCompletionOfTasks: 0,
      attireAppearanceAndPunctuality: 0,
      showCauseNotices: ''
    },
    weightage: {
      teachingWeight: 0.4, // Default for Assistant Professor
      researchWeight: 0.2,
      professionalDevelopmentWeight: 0.2,
      administrationWeight: 0.2
    },
    performanceScore: {
      weightedScore: 0,
      category: ''
    },
    hodRemarks: '',
    suggestionsForImprovement: '',
    hodSignature: {
      signed: false,
      hodName: '',
      signatureDate: new Date()
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
    // Check if user is authenticated and is HOD
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'HOD') {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    
    // Fetch faculty details
    const fetchFacultyDetails = async () => {
      try {
        // Fetch faculty user details
        const userResponse = await fetch(`/api/users/${facultyId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch faculty details');
        const facultyData = await userResponse.json();
        setFaculty(facultyData);
        
        // Fetch faculty self-appraisal
        const appraisalResponse = await fetch(`/api/appraisals/self?facultyId=${facultyId}`);
        if (!appraisalResponse.ok) throw new Error('Failed to fetch self-appraisal');
        const appraisalData = await appraisalResponse.json();
        setSelfAppraisal(appraisalData[0] || null);
        
        // Fetch existing HOD appraisal if any
        const hodAppraisalResponse = await fetch(`/api/appraisals/hod?facultyId=${facultyId}`);
        if (hodAppraisalResponse.ok) {
          const hodAppraisalData = await hodAppraisalResponse.json();
          if (hodAppraisalData && hodAppraisalData.length > 0) {
            setFormData(hodAppraisalData[0]);
          } else {
            // Set default weightage based on faculty position
            if (facultyData.designation === 'Assistant Professor') {
              setFormData((prev: FormData) => ({
                ...prev,
                weightage: {
                  teachingWeight: 0.4,
                  researchWeight: 0.2,
                  professionalDevelopmentWeight: 0.2,
                  administrationWeight: 0.2
                }
              }));
            } else if (facultyData.designation === 'Associate Professor') {
              setFormData((prev: FormData) => ({
                ...prev,
                weightage: {
                  teachingWeight: 0.3,
                  researchWeight: 0.3,
                  professionalDevelopmentWeight: 0.2,
                  administrationWeight: 0.2
                }
              }));
            } else if (facultyData.designation === 'Professor') {
              setFormData((prev: FormData) => ({
                ...prev,
                weightage: {
                  teachingWeight: 0.2,
                  researchWeight: 0.4,
                  professionalDevelopmentWeight: 0.2,
                  administrationWeight: 0.2
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load faculty data');
      } finally {
        setLoading(false);
      }
    };
    
      fetchFacultyDetails();
    };
    
    fetchData();
  }, [facultyId, router]);
  
  // Calculate weighted score
  useEffect(() => {
    if (selfAppraisal && formData) {
      // Get the total assessment score
      const assessmentTotal = Object.values(formData.assessment).reduce((sum: number, value: any) => {
        return typeof value === 'number' ? sum + value : sum;
      }, 0) / 10; // Divide by 10 to get score out of 25
      
      // Calculate weighted score
      const teachingScore = selfAppraisal.teachingScore || 0;
      const researchScore = selfAppraisal.researchScore || 0;
      const professionalDevScore = selfAppraisal.professionalDevelopmentScore || 0;
      
      const weightedScore = 
        (teachingScore * formData.weightage.teachingWeight) +
        (researchScore * formData.weightage.researchWeight) +
        (professionalDevScore * formData.weightage.professionalDevelopmentWeight) +
        (assessmentTotal * formData.weightage.administrationWeight);
      
      // Determine category
      let category = '';
      if (weightedScore < 60) category = 'Below Average';
      else if (weightedScore >= 60 && weightedScore < 70) category = 'Average';
      else if (weightedScore >= 70 && weightedScore < 80) category = 'Good';
      else if (weightedScore >= 80 && weightedScore < 90) category = 'Very Good';
      else if (weightedScore >= 90) category = 'Excellent';
      
      setFormData((prev: FormData) => ({
        ...prev,
        performanceScore: {
          weightedScore: Math.round(weightedScore * 100) / 100, // Round to 2 decimal places
          category
        }
      }));
    }
  }, [selfAppraisal, formData.assessment, formData.weightage]);
  
  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: FormData) => {
      const sectionData = prev[section as keyof FormData];
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value
          }
        };
      }
      return { ...prev, [section]: value };
    });
  };
  
  const handleAssessmentChange = (field: string, value: number) => {
    // Ensure value is between 0 and 25
    const validValue = Math.min(Math.max(value, 0), 25);
    handleInputChange('assessment', field, validValue);
  };
  
  const handleWeightageChange = (field: string, value: number) => {
    // Ensure value is between 0 and 1
    const validValue = Math.min(Math.max(value, 0), 1);
    handleInputChange('weightage', field, validValue);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        facultyId,
        facultyName: faculty?.name,
        departmentId: faculty?.departmentId,
        departmentName: faculty?.departmentName,
        academicYear: selfAppraisal?.academicYear || new Date().getFullYear().toString(),
        selfAppraisalId: selfAppraisal?._id,
        hodSignature: {
          ...formData.hodSignature,
          signed: true,
          hodName: user?.name,
          signatureDate: new Date()
        }
      };
      
      // Submit to API
      const response = await fetch('/api/appraisals/hod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appraisal');
      }
      
      setSuccess('Appraisal submitted successfully');
      setTimeout(() => {
        router.push('/hod/appraisal/review');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting appraisal:', error);
      setError(error.message || 'Failed to submit appraisal');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!faculty || !selfAppraisal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Faculty self-appraisal not found or not submitted yet.</p>
          <button 
            onClick={() => router.push('/hod')}
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
            <p>{faculty.name}</p>
          </div>
          <div>
            <p className="font-semibold">Department:</p>
            <p>{faculty.departmentName}</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">HOD's Assessment (Maximum of 25 Points)</h2>
          <p className="text-sm mb-4 text-center">0-8: Below average, 8-12: Average, 12-16: Above average, 16-20: Good, 20-25: Excellent.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <tbody>
                <tr>
                  <td className="py-2 px-4 border">1. Initiative and Drive Exhibited</td>
                  <td className="py-2 px-4 border w-32">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.initiativeAndDrive} 
                      onChange={(e) => handleAssessmentChange('initiativeAndDrive', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">2. Availing of Leave/Permissions</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.availingOfLeavePermissions} 
                      onChange={(e) => handleAssessmentChange('availingOfLeavePermissions', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">3. Domain Knowledge</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.domainKnowledge} 
                      onChange={(e) => handleAssessmentChange('domainKnowledge', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">4. Efficacy of Student Mentoring</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.efficacyOfStudentMentoring} 
                      onChange={(e) => handleAssessmentChange('efficacyOfStudentMentoring', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">5. Administrative Efficiency</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.administrativeEfficiency} 
                      onChange={(e) => handleAssessmentChange('administrativeEfficiency', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">6. Compliance of Institutional Policies & Procedures</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.complianceOfInstitutionalPolicies} 
                      onChange={(e) => handleAssessmentChange('complianceOfInstitutionalPolicies', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">7. Collegiality and Teamwork</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.collegialityAndTeamwork} 
                      onChange={(e) => handleAssessmentChange('collegialityAndTeamwork', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">8. Class Control & Innovation in Teaching</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.classControlAndInnovation} 
                      onChange={(e) => handleAssessmentChange('classControlAndInnovation', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">9. Timely completion of given Tasks</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.timelyCompletionOfTasks} 
                      onChange={(e) => handleAssessmentChange('timelyCompletionOfTasks', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">10. Attire, Appearance & Punctuality</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      min="0" 
                      max="25" 
                      value={formData.assessment.attireAppearanceAndPunctuality} 
                      onChange={(e) => handleAssessmentChange('attireAppearanceAndPunctuality', parseInt(e.target.value))} 
                      className="w-full p-1 border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <label className="block font-medium mb-2">* List the details of Show Cause Notices/Memo's given during the assessment period, if any:</label>
            <textarea 
              value={formData.assessment.showCauseNotices} 
              onChange={(e) => handleInputChange('assessment', 'showCauseNotices', e.target.value)} 
              className="w-full p-2 border rounded h-24"
            ></textarea>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">Overall Assessment</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Weightage</th>
                  <th className="py-2 px-4 border">Assistant Professor</th>
                  <th className="py-2 px-4 border">Associate Professor</th>
                  <th className="py-2 px-4 border">Professor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border">Part A (Teaching)</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Assistant Professor' ? formData.weightage.teachingWeight : 0.4} 
                      onChange={(e) => faculty.designation === 'Assistant Professor' && handleWeightageChange('teachingWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Assistant Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Associate Professor' ? formData.weightage.teachingWeight : 0.3} 
                      onChange={(e) => faculty.designation === 'Associate Professor' && handleWeightageChange('teachingWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Associate Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Professor' ? formData.weightage.teachingWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Professor' && handleWeightageChange('teachingWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Professor'}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Part B (Research, IPR & Consultancy)</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Assistant Professor' ? formData.weightage.researchWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Assistant Professor' && handleWeightageChange('researchWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Assistant Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Associate Professor' ? formData.weightage.researchWeight : 0.3} 
                      onChange={(e) => faculty.designation === 'Associate Professor' && handleWeightageChange('researchWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Associate Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Professor' ? formData.weightage.researchWeight : 0.4} 
                      onChange={(e) => faculty.designation === 'Professor' && handleWeightageChange('researchWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Professor'}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Part C (Professional Development)</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Assistant Professor' ? formData.weightage.professionalDevelopmentWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Assistant Professor' && handleWeightageChange('professionalDevelopmentWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Assistant Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Associate Professor' ? formData.weightage.professionalDevelopmentWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Associate Professor' && handleWeightageChange('professionalDevelopmentWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Associate Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Professor' ? formData.weightage.professionalDevelopmentWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Professor' && handleWeightageChange('professionalDevelopmentWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Professor'}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Part D (Administration + HoD Assessment)</td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Assistant Professor' ? formData.weightage.administrationWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Assistant Professor' && handleWeightageChange('administrationWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Assistant Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Associate Professor' ? formData.weightage.administrationWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Associate Professor' && handleWeightageChange('administrationWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Associate Professor'}
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1" 
                      value={faculty.designation === 'Professor' ? formData.weightage.administrationWeight : 0.2} 
                      onChange={(e) => faculty.designation === 'Professor' && handleWeightageChange('administrationWeight', parseFloat(e.target.value))} 
                      className="w-full p-1 border rounded"
                      disabled={faculty.designation !== 'Professor'}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <table className="min-w-full bg-white border">
              <tbody>
                <tr>
                  <td className="py-2 px-4 border font-medium">Faculty's Self Assessment (X) out of 375</td>
                  <td className="py-2 px-4 border">{selfAppraisal.totalScore || 0}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border font-medium">HOD's Assessment(Y) out of 25</td>
                  <td className="py-2 px-4 border">
                    {Object.values(formData.assessment).reduce((sum: number, value: any) => {
                      return typeof value === 'number' ? sum + value : sum;
                    }, 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border font-medium">Performance (Weighted Score) out of 100</td>
                  <td className="py-2 px-4 border">{formData.performanceScore.weightedScore}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h3 className="font-bold mb-2">Performance (Weighted Score)</h3>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Performance (Weighted Score)</th>
                  <th className="py-2 px-4 border">Assistant Professor</th>
                  <th className="py-2 px-4 border">Associate Professor</th>
                  <th className="py-2 px-4 border">Professor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border">Below Average (&lt;60)</td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Assistant Professor' && formData.performanceScore.category === 'Below Average' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Associate Professor' && formData.performanceScore.category === 'Below Average' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Professor' && formData.performanceScore.category === 'Below Average' && '✓'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Average (60-70)</td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Assistant Professor' && formData.performanceScore.category === 'Average' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Associate Professor' && formData.performanceScore.category === 'Average' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Professor' && formData.performanceScore.category === 'Average' && '✓'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Good (70-80)</td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Assistant Professor' && formData.performanceScore.category === 'Good' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Associate Professor' && formData.performanceScore.category === 'Good' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Professor' && formData.performanceScore.category === 'Good' && '✓'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Very Good (80-90)</td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Assistant Professor' && formData.performanceScore.category === 'Very Good' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Associate Professor' && formData.performanceScore.category === 'Very Good' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Professor' && formData.performanceScore.category === 'Very Good' && '✓'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">Excellent (90-100)</td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Assistant Professor' && formData.performanceScore.category === 'Excellent' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Associate Professor' && formData.performanceScore.category === 'Excellent' && '✓'}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {faculty.designation === 'Professor' && formData.performanceScore.category === 'Excellent' && '✓'}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm mt-2">* Please tick against the performance</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-bold mb-4">Suggestions for improvement:</h3>
          <textarea 
            value={formData.suggestionsForImprovement} 
            onChange={(e) => setFormData((prev: FormData) => ({ ...prev, suggestionsForImprovement: e.target.value }))} 
            className="w-full p-2 border rounded h-32"
            placeholder="Enter suggestions for improvement"
          ></textarea>
          
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">1. Name and Signature of HoD</p>
                <p className="mt-2">{user?.name}</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="hodSignature" 
                  checked={formData.hodSignature.signed} 
                  onChange={(e) => setFormData((prev: FormData) => ({
                    ...prev,
                    hodSignature: {
                      ...prev.hodSignature,
                      signed: e.target.checked,
                      hodName: user?.name || '',
                      signatureDate: new Date()
                    }
                  }))} 
                  className="mr-2"
                />
                <label htmlFor="hodSignature">I digitally sign this appraisal</label>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="font-bold">2. Principal's Observations and Remarks:</p>
            <div className="bg-blue-100 p-4 mt-2 rounded">
              <p className="text-sm italic">This section will be filled by the Principal</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            type="button" 
            onClick={() => router.push('/hod')} 
            className="bg-gray-500 text-white py-2 px-6 rounded mr-4 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving || !formData.hodSignature.signed} 
            className={`bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 ${(saving || !formData.hodSignature.signed) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Submitting...' : 'Submit Appraisal'}
          </button>
        </div>
      </form>
    </div>
  );
}