'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case 'Principal':
          router.push('/principal');
          break;
        case 'HOD':
          router.push('/hod');
          break;
        case 'Faculty':
          router.push('/faculty');
          break;
        default:
          router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LORDS Institute
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Faculty Appraisal System
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
}