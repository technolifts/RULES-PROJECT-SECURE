import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Mock the auth context
jest.mock('@/context/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: () => true,
      isLoading: false,
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'fake-token',
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    
    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
  
  it('shows loading state when authentication is being checked', () => {
    // Mock loading state
    mockUseAuth.mockReturnValue({
      isAuthenticated: () => false,
      isLoading: true,
      user: null,
      token: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    
    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('does not render children when not authenticated', () => {
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: () => false,
      isLoading: false,
      user: null,
      token: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    
    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
