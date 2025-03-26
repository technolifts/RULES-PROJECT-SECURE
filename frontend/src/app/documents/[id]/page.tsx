'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import DocumentPreview from '@/components/DocumentPreview';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/documents/${documentId}`);
        setDocument(response.data);
      } catch (err: any) {
        console.error('Failed to fetch document:', err);
        setError(err.response?.data?.detail || 'Failed to load document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/documents/${documentId}`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">Loading...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (error || !document) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error || 'Document not found'}</span>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Dashboard
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/documents/${documentId}/share`)}
                className="btn-secondary"
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{document.original_filename}</h1>
                <p className="text-gray-600">
                  {formatFileSize(document.file_size)} • Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                </p>
                {document.description && (
                  <p className="text-gray-700 mt-2">{document.description}</p>
                )}
              </div>
              
              <div className="mt-4 md:mt-0">
                <a
                  href={`/api/documents/${documentId}/download`}
                  className="btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
            
            <DocumentPreview 
              documentId={document.id} 
              mimeType={document.mime_type} 
              filename={document.original_filename}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
