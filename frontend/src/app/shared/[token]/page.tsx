'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface ShareLink {
  id: string;
  token: string;
  document_id: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface Document {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  description: string | null;
}

export default function SharedDocumentPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Validate share link
        const linkResponse = await axios.get(`/api/share-links/public/${token}`);
        setShareLink(linkResponse.data);
        
        // Fetch document details
        const docResponse = await axios.get(`/api/documents/${linkResponse.data.document_id}/shared/${token}`);
        setDocument(docResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        if (err.response?.status === 403) {
          setError('This share link has expired or is no longer active.');
        } else if (err.response?.status === 404) {
          setError('Share link not found or has been deleted.');
        } else {
          setError('Failed to load document. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = (mimeType: string): string => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('text')) return '📃';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Access Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
          <p className="text-gray-600 mb-6">The document you're looking for could not be found.</p>
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">{getFileIcon(document.mime_type)}</div>
          <div>
            <h1 className="text-2xl font-bold">{document.original_filename}</h1>
            <p className="text-gray-600">
              {formatFileSize(document.file_size)}
              {shareLink?.expires_at && (
                <span className="ml-4">
                  Expires: {new Date(shareLink.expires_at).toLocaleDateString()}
                </span>
              )}
            </p>
            {document.description && (
              <p className="text-gray-700 mt-2">{document.description}</p>
            )}
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="flex justify-center">
            <a
              href={`/api/documents/shared/${token}/download`}
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Document
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
