import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface MediaVerificationBadgeProps {
  isVerified?: boolean;
  verificationNotes?: string | null;
  isOwner: boolean;
  className?: string;
}

export default function MediaVerificationBadge({ 
  isVerified, 
  verificationNotes, 
  isOwner,
  className = "" 
}: MediaVerificationBadgeProps) {
  if (!isOwner && !isVerified) {
    return null; // Don't show unverified content to non-owners
  }

  if (isVerified) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs ${className}`}>
        <CheckCircle className="w-3 h-3" />
        Verified
      </div>
    );
  }

  if (verificationNotes) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs ${className}`}>
        <XCircle className="w-3 h-3" />
        Rejected
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs ${className}`}>
      <Clock className="w-3 h-3" />
      Pending Review
    </div>
  );
}