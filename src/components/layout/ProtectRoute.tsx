import { ReactNode } from 'react';
import { useAppSelector } from '../../redux/hooks';
import { getCurrentUser } from '../../redux/services/authSlice';
import { Navigate, useLocation } from 'react-router-dom';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'KEEPER' | 'USER' | 'ACCOUNTANT';

interface ProtectRouteProps {
  children: ReactNode;
}

const ProtectRoute = ({ children }: ProtectRouteProps) => {
  const user = useAppSelector(getCurrentUser);
  const location = useLocation();
  const currentPath = location.pathname;
  
  // First check: User must be authenticated for ALL protected routes
  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/" replace={true} />;
  }
  
  const userRole = user.role as UserRole;
  
  // Second check: User must have proper role access for this path
  const hasPathAccess = checkPathAccess(currentPath, userRole);
  
  if (!hasPathAccess) {
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case 'SUPER_ADMIN':
        return <Navigate to="/superadmin/" replace={true} />;
      case 'ADMIN':
        return <Navigate to="/admin" replace={true} />;
      case 'KEEPER':
        return <Navigate to="/keeper/products" replace={true} />;
      case 'USER':
        return <Navigate to="/seller/products" replace={true} />;
      case 'ACCOUNTANT':
        return <Navigate to="/accountant/adashboard" replace={true} />;
      default:
        // Fallback to login page if role is not recognized
        return <Navigate to="/" replace={true} />;
    }
  }
  
  // User is authenticated AND authorized, render the protected content
  return <>{children}</>;
};

/**
 * Checks if a user role has access to a specific path
 */
function checkPathAccess(path: string, role: UserRole): boolean {
  // Extract the base path and sub-path
  const pathParts = path.split('/').filter(Boolean);
  const basePath = '/' + (pathParts[0] || '');
  const subPath = pathParts[1] || '';
  
  // Define role hierarchy and allowed paths
  const rolePathAccess = {
    'SUPER_ADMIN': ['/superadmin', '/admin', '/keeper', '/seller', '/accountant'],
    'ADMIN': ['/admin', '/keeper', '/seller', '/accountant'],
    'KEEPER': ['/keeper'],
    'USER': ['/seller'],
    'ACCOUNTANT': ['/accountant']
  };
  
  // Common paths that all authenticated users can access within their base path
  const commonAccessPaths = [
    'profile', 
    'edit-profile', 
    'change-password'
  ];
  if (commonAccessPaths.includes(subPath)) {
    return rolePathAccess[role]?.includes(basePath) || false;
  }
  
  return rolePathAccess[role]?.includes(basePath) || false;
}

export default ProtectRoute;