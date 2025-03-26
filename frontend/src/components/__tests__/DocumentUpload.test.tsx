import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentUpload from '../DocumentUpload';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe('DocumentUpload', () => {
  const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the upload form', () => {
    render(<DocumentUpload />);
    
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByLabelText('File')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Document' })).toBeDisabled();
  });
  
  it('enables the upload button when a file is selected', async () => {
    render(<DocumentUpload />);
    
    const fileInput = screen.getByLabelText('File');
    await userEvent.upload(fileInput, mockFile);
    
    expect(screen.getByRole('button', { name: 'Upload Document' })).toBeEnabled();
  });
  
  it('shows an error for invalid file types', async () => {
    render(<DocumentUpload />);
    
    const invalidFile = new File(['test content'], 'test.exe', { type: 'application/octet-stream' });
    const fileInput = screen.getByLabelText('File');
    await userEvent.upload(fileInput, invalidFile);
    
    expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
  });
  
  it('uploads a file successfully', async () => {
    const onSuccess = jest.fn();
    mockedAxios.post.mockResolvedValueOnce({});
    
    render(<DocumentUpload onSuccess={onSuccess} />);
    
    const fileInput = screen.getByLabelText('File');
    await userEvent.upload(fileInput, mockFile);
    
    const descriptionInput = screen.getByLabelText('Description (optional)');
    await userEvent.type(descriptionInput, 'Test description');
    
    const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
    await userEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/documents',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles upload errors', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 415,
        data: {
          detail: 'File type not allowed by the server',
        },
      },
    });
    
    render(<DocumentUpload />);
    
    const fileInput = screen.getByLabelText('File');
    await userEvent.upload(fileInput, mockFile);
    
    const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
    await userEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('File type not allowed by the server')).toBeInTheDocument();
    });
  });
});
