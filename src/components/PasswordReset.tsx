import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Key,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface PasswordResetProps {
  onBack: () => void;
  token?: string; // For handling reset tokens from email links
}

export default function PasswordReset({ onBack, token }: PasswordResetProps) {
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<'request' | 'reset'>(!token ? 'request' : 'reset');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Password reset link sent! Check your email and click the link to reset your password.' 
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send reset email' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Password updated successfully! You can now sign in with your new password.' 
        });
        setTimeout(() => onBack(), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large particles */}
        <div className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{top: '12%', left: '8%', animationDelay: '0.3s', animationDuration: '3.2s'}}></div>
        <div className="absolute w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" style={{top: '18%', right: '12%', animationDelay: '1.3s'}}></div>
        <div className="absolute w-4 h-4 bg-indigo-300 rounded-full opacity-40 animate-ping" style={{top: '28%', left: '18%', animationDelay: '2.3s'}}></div>
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-70 animate-bounce" style={{top: '32%', right: '22%', animationDelay: '0.8s', animationDuration: '4.2s'}}></div>
        <div className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-50 animate-pulse" style={{top: '42%', left: '10%', animationDelay: '3.3s'}}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 animate-ping" style={{top: '48%', right: '8%', animationDelay: '1.8s'}}></div>
        
        {/* Medium particles */}
        <div className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-60 animate-bounce" style={{bottom: '38%', left: '15%', animationDelay: '2.8s', animationDuration: '5.2s'}}></div>
        <div className="absolute w-3 h-3 bg-emerald-400 rounded-full opacity-40 animate-pulse" style={{bottom: '43%', right: '18%', animationDelay: '4.3s'}}></div>
        <div className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-80 animate-ping" style={{bottom: '53%', left: '23%', animationDelay: '1.1s'}}></div>
        <div className="absolute w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-bounce" style={{bottom: '28%', right: '28%', animationDelay: '3.8s', animationDuration: '3.8s'}}></div>
        
        {/* Small particles */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse" style={{top: '63%', left: '28%', animationDelay: '1.5s'}}></div>
        <div className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-80 animate-ping" style={{top: '73%', right: '33%', animationDelay: '3.1s'}}></div>
        <div className="absolute w-2 h-2 bg-violet-300 rounded-full opacity-45 animate-bounce" style={{top: '83%', left: '33%', animationDelay: '4.5s', animationDuration: '6.2s'}}></div>
        <div className="absolute w-1 h-1 bg-cyan-200 rounded-full opacity-60 animate-pulse" style={{bottom: '18%', left: '38%', animationDelay: '5.3s'}}></div>
        <div className="absolute w-2 h-2 bg-orange-300 rounded-full opacity-50 animate-ping" style={{bottom: '23%', right: '11%', animationDelay: '2.1s'}}></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-black rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 dark:backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              {step === 'request' ? (
                <Mail className="w-10 h-10 text-white" />
              ) : (
                <Key className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {step === 'request' ? 'Reset Password' : 'Update Password'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {step === 'request'
                ? 'Enter your email address and we\'ll send you a reset link'
                : 'Enter your new password below'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Request Reset Form */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg border-2 border-white shadow-white/50 hover:shadow-white/80 hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}

          {/* Password Update Form */}
          {step === 'reset' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>

          {/* Help Text */}
          {step === 'request' && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                Don't remember your email? Contact support for assistance. 
                The reset link will be valid for 1 hour.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}