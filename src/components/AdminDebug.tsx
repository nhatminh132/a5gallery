import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminDebug: React.FC = () => {
  const { user, profile } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded p-2 text-xs max-w-xs">
      <div><strong>Debug Info:</strong></div>
      <div>User ID: {user?.id?.slice(0, 8)}...</div>
      <div>Email: {user?.email}</div>
      <div>Is Admin: {String(profile?.is_admin)}</div>
      <div>Profile: {profile ? 'Loaded' : 'Missing'}</div>
    </div>
  );
};

export default AdminDebug;