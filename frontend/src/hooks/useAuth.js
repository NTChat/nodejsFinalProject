// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Lấy thông tin user từ sessionStorage
      const userDataStr = sessionStorage.getItem('userData');
      const token = sessionStorage.getItem('authToken');
      
      if (userDataStr && token) {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Kiểm tra quyền admin
        setIsAdmin(userData.role === 'admin' || userData.isAdmin === true);
      }
    } catch (error) {
      console.error('Error reading auth data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isAdmin,
    loading
  };
};

export default useAuth;