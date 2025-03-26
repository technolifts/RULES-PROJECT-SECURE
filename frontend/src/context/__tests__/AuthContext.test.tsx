import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock js-cookie
jest.mock('js-cookie');
const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated() ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="username">{user.username}</div>}
      <button onClick={() => login('test@example.com', 'password123')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock cookie get to return null (no token)
    mockedCookies.get.mockReturnValue(undefined);
    
    // Mock axios defaults
    mockedAxios.defaults = {
      headers: {
        common: {}
      }
    } as any;
  });
  
  it('provides authentication state and methods', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    
    // Mock successful login
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        token_type: 'bearer'
      }
    });
    
    // Mock successful user fetch
    mockedAxios.get.mockResolvedValueOnce({
      data: { id: '1', username: 'testuser', email: 'test@example.com' }
    });
    
    // Mock cookie set
    mockedCookies.set.mockImplementation(() => {});
    
    // Click login button
    await userEvent.click(screen.getByText('Login'));
    
    // Should be authenticated after login
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });
    
    // Mock cookie get to return token
    mockedCookies.get.mockReturnValue('fake-token');
    
    // Mock successful logout
    mockedAxios.post.mockResolvedValueOnce({});
    
    // Mock cookie remove
    mockedCookies.remove.mockImplementation(() => {});
    
    // Click logout button
    await userEvent.click(screen.getByText('Logout'));
    
    // Should be logged out
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });
  
  it('handles login errors', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Mock failed login
    mockedAxios.post.mockRejectedValueOnce(new Error('Login failed'));
    
    // Click login button
    await userEvent.click(screen.getByText('Login'));
    
    // Should still be not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });
});
