'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user?.username}</span>
              <button 
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Your Documents</h2>
                <button 
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="btn-primary"
                >
                  {showUploadForm ? 'Cancel Upload' : 'Upload Document'}
                </button>
              </div>
              
              {showUploadForm && (
                <div className="mb-6">
                  <DocumentUpload onSuccess={handleUploadSuccess} />
                </div>
              )}
              
              <DocumentList />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
