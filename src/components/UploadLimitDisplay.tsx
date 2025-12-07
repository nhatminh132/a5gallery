import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkUploadLimit, formatFileSize, UploadLimitInfo } from '../lib/uploadLimits';
import { HardDrive, AlertTriangle, CheckCircle, Crown } from 'lucide-react';

interface UploadLimitDisplayProps {
  className?: string;
  showDetails?: boolean;
}

const UploadLimitDisplay: React.FC<UploadLimitDisplayProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { user } = useAuth();
  const [limitInfo, setLimitInfo] = useState<UploadLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check with a 0-byte file to get current stats
        const info = await checkUploadLimit(user.id, 0);
        setLimitInfo(info);
      } catch (error) {
        console.error('Error fetching upload limits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimitInfo();
  }, [user]);

  if (loading || !limitInfo) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-16 ${className}`} />
    );
  }

  const usagePercentage = limitInfo.isAdmin ? 0 : (limitInfo.usedMB / limitInfo.limitMB) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Storage Usage
          </h3>
          {limitInfo.isAdmin && (
            <Crown className="w-4 h-4 text-yellow-500" title="Admin - Unlimited Storage" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAtLimit ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {limitInfo.isAdmin ? (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-yellow-600 dark:text-yellow-400">Admin Account</span>
            <br />
            Unlimited storage available
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Currently used: {formatFileSize(limitInfo.usedMB * 1048576)}
          </p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Used: {formatFileSize(limitInfo.usedMB * 1048576)}</span>
              <span>Limit: {formatFileSize(limitInfo.limitMB * 1048576)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAtLimit
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{usagePercentage.toFixed(1)}% used</span>
              <span>
                {limitInfo.remainingMB > 0 
                  ? `${formatFileSize(limitInfo.remainingMB * 1048576)} remaining`
                  : 'Limit reached'
                }
              </span>
            </div>
          </div>

          {/* Status Message */}
          {showDetails && (
            <div className={`text-xs p-2 rounded-lg ${
              isAtLimit
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : isNearLimit
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            }`}>
              {isAtLimit ? (
                <p>
                  <strong>Storage limit reached!</strong><br />
                  Please delete some files or contact an admin to increase your limit.
                </p>
              ) : isNearLimit ? (
                <p>
                  <strong>Storage nearly full!</strong><br />
                  Consider deleting old files to free up space.
                </p>
              ) : (
                <p>
                  You have plenty of storage space available for uploads.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadLimitDisplay;