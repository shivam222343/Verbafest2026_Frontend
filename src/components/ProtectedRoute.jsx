import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, userRole, user } = useAuthStore();

    if (!isAuthenticated) {
        // Redirect to appropriate login page based on attempted access
        if (allowedRoles.includes('admin')) {
            return <Navigate to="/admin/login" replace />;
        }
        return <Navigate to="/participant/login" replace />;
    }

    // Check if profile is complete for admins
    if (userRole === 'admin' && user?.profileComplete === false) {
        // Allow access to complete-profile page and EventControlRoom
        const currentPath = window.location.pathname;
        const allowedPaths = ['/admin/complete-profile', '/admin/subevents'];

        // Check if current path starts with any allowed path
        const isAllowedPath = allowedPaths.some(path => currentPath.includes(path));

        if (!isAllowedPath) {
            return <Navigate to="/admin/complete-profile" replace />;
        }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // User is authenticated but doesn't have the right role
        if (userRole === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/participant/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
