import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

const PrivateRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return null;
};

export default PrivateRoute;
