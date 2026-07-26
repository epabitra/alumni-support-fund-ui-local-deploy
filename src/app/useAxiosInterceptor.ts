import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const useAxiosInterceptor = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.statusCode === 403) {
          // Subscription expired - redirect to dashboard
          navigate('/dashboard');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);
};


