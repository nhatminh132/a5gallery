import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserUploadStats, 
  updateUserUploadLimit, 
  formatFileSize 
} from '../lib/uploadLimits';
import { 
  Users, 
  Edit3, 
  Save, 
  X, 
  HardDrive, 
  Crown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface UserUploadStat {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  upload_limit_mb: number;
  total_uploaded_mb: number;
  created_at: string;
}

const AdminUploadManager: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserUploadStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(500);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserUploadStats();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLimit = (userId: string, currentLimit: number) => {
    setEditingUser(userId);
    setNewLimit(currentLimit);
    setError(null);
    setSuccess(null);
  };

  const handleSaveLimit = async (userId: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      console.log(`🔧 Admin attempting to update user ${userId} limit to ${newLimit}MB`);

      if (newLimit < 1) {
        throw new Error('Upload limit must be at least 1MB');
      }

      await updateUserUploadLimit(userId, newLimit);
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === userId 
          ? { ...user, upload_limit_mb: newLimit }
          : user
      ));

      setSuccess(`Upload limit updated to ${newLimit}MB successfully!`);
      setEditingUser(null);
      
      console.log('✅ Upload limit update completed');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('❌ Failed to save upload limit:', err);
      setError(`Failed to update limit: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError(null);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Upload Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage upload limits for all users
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Users List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((userData) => {
          const usagePercentage = userData.is_admin ? 0 : getUsagePercentage(userData.total_uploaded_mb, userData.upload_limit_mb);
          const usageStatus = getUsageStatus(usagePercentage);
          const isEditing = editingUser === userData.id;

          return (
            <div key={userData.id} className="p-6">
              <div className="flex items-start justify-between">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {userData.full_name || userData.email}
                      </h4>
                      {userData.is_admin && (
                        <Crown className="w-4 h-4 text-yellow-500" title="Admin" />
                      )}
                    </div>
                  </div>
                  
                  {userData.full_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {userData.email}
                    </p>
                  )}

                  {/* Usage Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Used: {formatFileSize(userData.total_uploaded_mb * 1048576)}
                      </span>
                    </div>
                    
                    {!userData.is_admin && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Limit: {formatFileSize(userData.upload_limit_mb * 1048576)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className={`font-medium ${
                          usageStatus === 'danger' ? 'text-red-600 dark:text-red-400' :
                          usageStatus === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {usagePercentage}% used
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress Bar for Non-Admins */}
                  {!userData.is_admin && (
                    <div className="mt-3 w-full max-w-md">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usageStatus === 'danger' ? 'bg-red-500' :
                            usageStatus === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Controls */}
                {!userData.is_admin && (
                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newLimit}
                          onChange={(e) => setNewLimit(Number(e.target.value))}
                          className="w-24 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                          min="1"
                          max="10000"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">MB</span>
                        <button
                          onClick={() => handleSaveLimit(userData.id)}
                          disabled={saving}
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditLimit(userData.id, userData.upload_limit_mb)}
                        className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit upload limit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      )}
    </div>
  );
};

export default AdminUploadManager;