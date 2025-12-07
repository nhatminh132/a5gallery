import { Clock, Info } from 'lucide-react';

export default function PendingVerificationNotice() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Pending Admin Verification
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Your uploaded content is currently under review. Once verified by an admin, it will be visible to all users and become shareable.
          </p>
        </div>
      </div>
    </div>
  );
}