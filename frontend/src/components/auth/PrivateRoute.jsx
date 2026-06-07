import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../../utility/auth';

const PrivateRoute = ({ children, allowedRoles }) => {
  const auth = getAuthSession();
  const location = useLocation();

  if (!auth.role) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    // Role not allowed, redirect to their respective dashboard
    if (auth.role === 'admin') return <Navigate to="/admin/home" replace />;
    if (auth.role === 'business') return <Navigate to="/business/home" replace />;
    return <Navigate to="/candidate/home" replace />;
  }

  return children;
};

export default PrivateRoute;
