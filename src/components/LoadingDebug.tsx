import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoadingDebug() {
  const { user, profile, session, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded-lg text-xs z-50"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">🔍 Debug Info</h4>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        <div>Auth Loading: {loading ? '🔄 TRUE' : '✅ FALSE'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌ NULL'}</div>
        <div>Profile: {profile ? `✅ ${profile.full_name || 'No Name'}` : '❌ NULL'}</div>
        <div>Session: {session ? '✅ ACTIVE' : '❌ NULL'}</div>
        <div className="pt-2 border-t border-gray-600">
          <div>Current Route: {window.location.pathname}</div>
          <div>Timestamp: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}