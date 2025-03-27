import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CookieTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Not tested');
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://eventduniya-server.onrender.com';

  const testCookie = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/test-cookie`, {
        withCredentials: true
      });
      
      setTestResult(`Cookie set successfully: ${response.data.message}`);
      
      // After setting a cookie, check if we can see it
      const checkResponse = await axios.get(`${API_URL}/api/health`, {
        withCredentials: true
      });
      
      setHealthData(checkResponse.data);
    } catch (err) {
      console.error('Cookie test error:', err);
      setError('Failed to test cookies. See console for details.');
      setTestResult('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mt-4">
      <h2 className="text-xl font-semibold mb-2">Cookie Test Utility</h2>
      <p className="text-sm text-gray-400 mb-4">This tests if cookies are properly set and received</p>
      
      <button 
        onClick={testCookie}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Cookie'}
      </button>
      
      <div className="mt-4">
        <p><strong>Result:</strong> {testResult}</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      
      {healthData && (
        <div className="mt-4 p-4 bg-gray-900 rounded border border-gray-700 overflow-x-auto">
          <h3 className="text-lg font-medium mb-2">Server Health Data:</h3>
          <pre className="text-xs text-gray-400">{JSON.stringify(healthData, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>If cookies aren't working, check:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>CORS configuration on server</li>
          <li>Same-Site cookie policy</li>
          <li>Domain settings</li>
          <li>HTTP vs HTTPS (Secure flag)</li>
        </ul>
      </div>
    </div>
  );
};

export default CookieTest;
