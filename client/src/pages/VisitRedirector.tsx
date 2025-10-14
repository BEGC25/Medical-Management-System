import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function VisitRedirector() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId');

    if (!patientId) {
      setError('No patient ID provided');
      setTimeout(() => setLocation('/treatment'), 2000);
      return;
    }

    const findOrCreateVisit = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check for existing open visit today
        const response = await fetch(`/api/encounters?patientId=${patientId}&date=${today}&status=open`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch visits');
        }

        const visits = await response.json();

        if (visits.length > 0) {
          // Found existing visit, navigate to it
          setLocation(`/treatment/${visits[0].encounterId}`);
        } else {
          // Create new visit
          const createResponse = await fetch('/api/encounters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId,
              visitDate: today,
              attendingClinician: 'Dr. System', // Will be updated with actual user
            }),
          });

          if (!createResponse.ok) {
            throw new Error('Failed to create visit');
          }

          const newVisit = await createResponse.json();
          setLocation(`/treatment/${newVisit.encounterId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open visit');
        setTimeout(() => setLocation('/treatment'), 3000);
      }
    };

    findOrCreateVisit();
  }, [setLocation]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Opening Visit...</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait</p>
      </div>
    </div>
  );
}
