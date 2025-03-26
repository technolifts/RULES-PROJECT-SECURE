'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface DocumentUploadProps {
  onSuccess?: () => void;
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (client-side validation)
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        setError('File size exceeds the limit of 10MB');
        return;
      }
      
      // Validate file type (client-side validation)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('File type not allowed. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (description) {
        formData.append('description', description);
      }
      
      await axios.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });
      
      setFile(null);
      setDescription('');
      setProgress(0);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh the document list
      router.refresh();
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (err.response?.status === 413) {
        setError('File size exceeds the server limit');
      } else if (err.response?.status === 415) {
        setError('File type not allowed by the server');
      } else {
        setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Upload Document</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="file" className="form-label">
            File
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="form-label">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            rows={3}
            disabled={isUploading}
          ></textarea>
        </div>
        
        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Uploading: {progress}%</p>
          </div>
        )}
        
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isUploading || !file}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
