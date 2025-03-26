'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DocumentPreviewProps {
  documentId: string;
  mimeType: string;
  filename: string;
  shareToken?: string;
}

export default function DocumentPreview({ documentId, mimeType, filename, shareToken }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePreviewUrl = () => {
      // Determine the appropriate preview URL based on whether it's a shared document or not
      if (shareToken) {
        return `/api/documents/shared/${shareToken}/preview`;
      } else {
        return `/api/documents/${documentId}/preview`;
      }
    };

    setPreviewUrl(generatePreviewUrl());
    setIsLoading(false);
  }, [documentId, shareToken]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading preview...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  // Render different preview based on mime type
  const renderPreview = () => {
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={previewUrl || ''} 
            alt={filename}
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-[600px]">
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-0"
            title={filename}
          />
        </div>
      );
    } else if (mimeType.includes('text/') || 
               mimeType === 'application/json') {
      return (
        <div className="w-full">
          <iframe 
            src={previewUrl} 
            className="w-full h-[400px] border border-gray-300 rounded"
            title={filename}
          />
        </div>
      );
    } else {
      // For other file types, show a download prompt
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-lg mb-4">Preview not available for this file type</p>
          <a 
            href={shareToken ? `/api/documents/shared/${shareToken}/download` : `/api/documents/${documentId}/download`}
            className="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download to view
          </a>
        </div>
      );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Document Preview</h3>
      {renderPreview()}
    </div>
  );
}
