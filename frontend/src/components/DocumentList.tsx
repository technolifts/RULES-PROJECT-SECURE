'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/documents/${id}`);
      // Remove the deleted document from the list
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('text')) return '📃';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents found. Upload your first document to get started.
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getFileIcon(doc.mime_type)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.original_filename}</div>
                    {doc.description && (
                      <div className="text-sm text-gray-500">{doc.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(doc.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Download
                </button>
                <button 
                  onClick={() => window.location.href = `/documents/${doc.id}/share`}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  Share
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
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
  );
}
