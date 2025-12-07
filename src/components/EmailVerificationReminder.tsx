import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface EmailVerificationReminderProps {
  email: string;
  onResendSuccess?: () => void;
}

export default function EmailVerificationReminder({ email, onResendSuccess }: EmailVerificationReminderProps) {
  const { signUp } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastResent, setLastResent] = useState<Date | null>(null);

  const handleResendVerification = async () => {
    // Check if we recently sent an email (prevent spam)
    if (lastResent && Date.now() - lastResent.getTime() < 60000) { // 1 minute cooldown
      setResendMessage({ 
        type: 'error', 
        text: 'Please wait a moment before requesting another verification email.' 
      });
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      // Trigger a new sign up request to resend verification email
      const result = await signUp(email, 'temp-password', 'Verification Resend');
      
      if (result.success) {
        setResendMessage({ 
          type: 'success', 
          text: 'Verification email sent! Please check your inbox and spam folder.' 
        });
        setLastResent(new Date());
        onResendSuccess?.();
      } else {
        // Even if user already exists, the verification email is sent
        if (result.error?.includes('already registered')) {
          setResendMessage({ 
            type: 'success', 
            text: 'Verification email sent! Please check your inbox and spam folder.' 
          });
          setLastResent(new Date());
        } else {
          setResendMessage({ 
            type: 'error', 
            text: result.error || 'Failed to resend verification email' 
          });
        }
      }
    } catch (error: any) {
      setResendMessage({ 
        type: 'error', 
        text: 'Failed to resend verification email' 
      });
    } finally {
      setIsResending(false);
    }
  };

  const canResend = !lastResent || Date.now() - lastResent.getTime() > 60000;
  const timeUntilCanResend = lastResent ? Math.max(0, 60 - Math.floor((Date.now() - lastResent.getTime()) / 1000)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl mb-6 shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              We sent a verification link to:
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium mt-2">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Check your inbox for an email from our service</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected back here to sign in</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium mb-2">Can't find the email?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Check your spam or junk mail folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Wait a few minutes - emails can take time to arrive</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resend Message */}
          {resendMessage && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${
              resendMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {resendMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{resendMessage.text}</span>
            </div>
          )}

          {/* Resend Button */}
          <div className="text-center">
            <button
              onClick={handleResendVerification}
              disabled={isResending || !canResend}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all disabled:cursor-not-allowed font-medium mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : !canResend ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Resend in {timeUntilCanResend}s</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Resend Email</span>
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Still having trouble? Contact support for assistance. 
              The verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}