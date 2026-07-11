import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to easily consume AuthContext states and methods.
 * @returns {Object} AuthContext fields (user, loading, error, login, register, logout)
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider');
  }
  return context;
};

export default useAuth;
