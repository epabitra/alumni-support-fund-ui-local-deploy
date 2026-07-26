import axios, { AxiosInstance } from 'axios';
import { getAuth } from './AuthHelpers';

export function setupAxios(axiosInstance: AxiosInstance | typeof axios) {
  axiosInstance.defaults.headers.Accept = 'application/json';
  // Skip ngrok's free-tier browser-warning interstitial so API responses stay JSON
  axiosInstance.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

  // Request interceptor: Add Bearer token to all requests
  axiosInstance.interceptors.request.use(
    (config: any) => {
      const auth = getAuth();
      if (auth && auth.api_token) {
        config.headers.Authorization = `Bearer ${auth.api_token}`;
      }
      return config;
    },
    (err: any) => Promise.reject(err)
  );

  // Response interceptor: Handle errors
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      const currentPath = window.location.pathname;

      if (error.response?.status === 401) {
        // Token expired or invalid
        if (currentPath !== '/login') {
          console.error('Token expired. Please login again.');
        }
      } else if (error.response?.status === 400) {
        // Bad request - show field errors or message
        const fieldErrors = error.response.data.fieldErrors;
        if (fieldErrors && fieldErrors.length > 0) {
          console.error('Validation errors:', fieldErrors);
        } else if (error.response.data.message) {
          console.error(error.response.data.message);
        }
      } else if (error.response?.status === 500) {
        console.error('Internal server error');
      }

      return Promise.reject(error);
    }
  );
}


