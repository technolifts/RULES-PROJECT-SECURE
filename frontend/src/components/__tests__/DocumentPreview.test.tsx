import { render, screen } from '@testing-library/react';
import DocumentPreview from '../DocumentPreview';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('DocumentPreview', () => {
  it('renders image preview for image mime types', () => {
    render(
      <DocumentPreview 
        documentId="123" 
        mimeType="image/jpeg" 
        filename="test.jpg" 
      />
    );
    
    // Wait for the component to finish loading
    expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
    
    // Check that an img element is rendered
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/api/documents/123/preview');
    expect(img).toHaveAttribute('alt', 'test.jpg');
  });
  
  it('renders PDF preview for PDF mime type', () => {
    render(
      <DocumentPreview 
        documentId="123" 
        mimeType="application/pdf" 
        filename="test.pdf" 
      />
    );
    
    // Check that an iframe is rendered
    const iframe = screen.getByTitle('test.pdf');
    expect(iframe).toHaveAttribute('src', '/api/documents/123/preview');
  });
  
  it('renders text preview for text mime types', () => {
    render(
      <DocumentPreview 
        documentId="123" 
        mimeType="text/plain" 
        filename="test.txt" 
      />
    );
    
    // Check that an iframe is rendered
    const iframe = screen.getByTitle('test.txt');
    expect(iframe).toHaveAttribute('src', '/api/documents/123/preview');
  });
  
  it('renders download prompt for unsupported mime types', () => {
    render(
      <DocumentPreview 
        documentId="123" 
        mimeType="application/octet-stream" 
        filename="test.bin" 
      />
    );
    
    // Check that the download prompt is rendered
    expect(screen.getByText('Preview not available for this file type')).toBeInTheDocument();
    expect(screen.getByText('Download to view')).toBeInTheDocument();
  });
  
  it('uses share token URL when provided', () => {
    render(
      <DocumentPreview 
        documentId="123" 
        mimeType="image/jpeg" 
        filename="test.jpg" 
        shareToken="abc123" 
      />
    );
    
    // Check that the image src uses the share token URL
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/api/documents/shared/abc123/preview');
  });
});
