'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format, addDays } from 'date-fns';

interface Document {
  id: string;
  original_filename: string;
  description: string | null;
}

interface ShareLink {
  id: string;
  token: string;
  document_id: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ShareDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch document details
        const docResponse = await axios.get(`/api/documents/${documentId}`);
        setDocument(docResponse.data);
        
        // Fetch existing share links for this document
        const linksResponse = await axios.get('/api/share-links');
        const documentLinks = linksResponse.data.filter(
          (link: ShareLink) => link.document_id === documentId
        );
        setShareLinks(documentLinks);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.detail || 'Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [documentId]);
  
  const handleCreateShareLink = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      const payload: any = {
        document_id: documentId,
      };
      
      // Add expiration date if set
      if (expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString();
      }
      
      const response = await axios.post('/api/share-links', payload);
      setShareLinks([...shareLinks, response.data]);
      setExpiresAt('');
    } catch (err: any) {
      console.error('Failed to create share link:', err);
      setError(err.response?.data?.detail || 'Failed to create share link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteShareLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/share-links/${id}`);
      setShareLinks(shareLinks.filter(link => link.id !== id));
    } catch (err: any) {
      console.error('Failed to delete share link:', err);
      alert('Failed to delete share link. Please try again.');
    }
  };
  
  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
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
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Share Document</h1>
            {document && (
              <div className="mb-4">
                <h2 className="text-lg font-medium">Document: {document.original_filename}</h2>
                {document.description && (
                  <p className="text-gray-600">{document.description}</p>
                )}
              </div>
            )}
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Create New Share Link</h3>
              <div className="flex items-end gap-4">
                <div className="flex-grow">
                  <label htmlFor="expiresAt" className="form-label">
                    Expires At (optional)
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    className="form-input"
                  />
                </div>
                <button
                  onClick={handleCreateShareLink}
                  disabled={isCreating}
                  className="btn-primary h-10"
                >
                  {isCreating ? 'Creating...' : 'Create Share Link'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Share Links</h2>
            
            {shareLinks.length === 0 ? (
              <p className="text-gray-500">No share links created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shareLinks.map((link) => (
                      <tr key={link.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={getShareUrl(link.token)}
                              readOnly
                              className="form-input text-sm"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                              onClick={() => copyToClipboard(getShareUrl(link.token))}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="Copy to clipboard"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(link.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {link.expires_at 
                            ? new Date(link.expires_at).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteShareLink(link.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
