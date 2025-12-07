import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface AuthCallbackProps {
  onComplete: () => void;
}

export default function AuthCallback({ onComplete }: AuthCallbackProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token_hash = urlParams.get('token_hash');
        const type = urlParams.get('type');
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');

        console.log('Auth callback params:', { token_hash, type, access_token: !!access_token, refresh_token: !!refresh_token });

        if (token_hash && type) {
          console.log('Processing token hash for type:', type);
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          });

          if (error) {
            console.error('Token verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            return;
          }

          if (data.user) {
            console.log('Token verification successful');
            
            switch (type) {
              case 'signup':
                setStatus('success');
                setMessage('Email verified successfully! Your account is now active and you can sign in.');
                break;
              case 'magiclink':
                setStatus('success');
                setMessage('Successfully signed in with magic link!');
                break;
              case 'email_change':
                setStatus('success');
                setMessage('Email address updated successfully! You can now use your new email to sign in.');
                break;
              case 'recovery':
              case 'password_recovery':
                setStatus('success');
                setMessage('You can now update your password. You will be redirected to set a new password.');
                break;
              default:
                setStatus('success');
                setMessage('Authentication successful!');
            }
          }
        } else if (access_token && refresh_token) {
          // Handle OAuth callback
          console.log('Processing OAuth callback');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('OAuth session error:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            return;
          }

          if (data.user) {
            console.log('OAuth authentication successful');
            setStatus('success');
            setMessage('Successfully signed in!');
          }
        } else {
          // No auth parameters, might be a direct visit
          console.log('No auth parameters found, redirecting...');
          setTimeout(onComplete, 1000);
          return;
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect after success/error
        setTimeout(onComplete, 3000);

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        setTimeout(onComplete, 3000);
      }
    };

    handleAuthCallback();
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center">
          {status === 'processing' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                <LoadingSpinner size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Processing...
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Success!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting you to the gallery...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-6">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Authentication Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {message}
              </p>
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Return to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}