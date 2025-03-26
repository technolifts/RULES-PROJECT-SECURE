'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

interface AuditLogSummary {
  period: string;
  total_events: number;
  actions: Record<string, number>;
  resources: Record<string, number>;
  user_activity: Record<string, number>;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    days: 7,
  });
  
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch audit logs
        const logsResponse = await axios.get('/api/audit-logs', {
          params: {
            limit: 100,
            action: filters.action || undefined,
            resource_type: filters.resource_type || undefined,
          }
        });
        setLogs(logsResponse.data);
        
        // Fetch summary
        const summaryResponse = await axios.get('/api/audit-logs/summary', {
          params: { days: filters.days }
        });
        setSummary(summaryResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch audit logs:', err);
        if (err.response?.status === 403) {
          setError('You do not have permission to view audit logs');
        } else {
          setError('Failed to load audit logs. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [filters]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">Loading audit logs...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Dashboard
            </button>
          </div>
          
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="action" className="form-label">Action</label>
                <select
                  id="action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All Actions</option>
                  {summary && Object.keys(summary.actions).map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="resource_type" className="form-label">Resource Type</label>
                <select
                  id="resource_type"
                  name="resource_type"
                  value={filters.resource_type}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All Resources</option>
                  {summary && Object.keys(summary.resources).map(resource => (
                    <option key={resource} value={resource}>{resource}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="days" className="form-label">Time Period</label>
                <select
                  id="days"
                  name="days"
                  value={filters.days}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          {summary && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Total Events</h3>
                  <p className="text-3xl font-bold">{summary.total_events}</p>
                  <p className="text-sm text-blue-600">in the last {summary.period}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Top Action</h3>
                  {Object.entries(summary.actions).length > 0 ? (
                    <>
                      <p className="text-3xl font-bold">
                        {Object.entries(summary.actions).sort((a, b) => b[1] - a[1])[0][0]}
                      </p>
                      <p className="text-sm text-green-600">
                        {Object.entries(summary.actions).sort((a, b) => b[1] - a[1])[0][1]} events
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No actions recorded</p>
                  )}
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">Most Active User</h3>
                  {Object.entries(summary.user_activity).length > 0 ? (
                    <>
                      <p className="text-3xl font-bold">
                        {Object.entries(summary.user_activity).sort((a, b) => b[1] - a[1])[0][0]}
                      </p>
                      <p className="text-sm text-purple-600">
                        {Object.entries(summary.user_activity).sort((a, b) => b[1] - a[1])[0][1]} events
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No user activity</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Logs Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.resource_type}
                        {log.resource_id && <span className="ml-1 text-xs text-gray-400">({log.resource_id.substring(0, 8)}...)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || 'Unknown'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
