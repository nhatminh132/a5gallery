import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';
import PasswordReset from './PasswordReset';
import { 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  User,
  Mail,
  Lock,
  Github,
  CheckCircle,
  Key
} from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, signIn, signInWithOAuth, signInWithMagicLink } = useAuth();
  const { t } = useLanguage();

  // Show password reset component
  if (showPasswordReset) {
    return (
      <PasswordReset 
        onBack={() => setShowPasswordReset(false)}
      />
    );
  }

  // Validation
  const validateForm = () => {
    if (!email) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    
    if (isMagicLink) {
      return null; // Only email validation for magic links
    }
    
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (isSignUp && !fullName.trim()) return 'Full name is required';
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isMagicLink) {
        const result = await signInWithMagicLink(email);
        if (result.success) {
          setSuccess(result.message || 'Magic link sent!');
        } else {
          setError(result.error || 'Failed to send magic link');
        }
      } else if (isSignUp) {
        const result = await signUp(email, password, fullName);
        if (result.success) {
          setSuccess(result.message || 'Account created successfully!');
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.error || 'Sign in failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const neonButtonClasses = "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-black hover:bg-neutral-900 transition-all disabled:opacity-50 border-2 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.55)] hover:shadow-[0_0_22px_rgba(255,255,255,0.9)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black";
  const neonInputClasses = "w-full pl-10 pr-4 py-3 rounded-xl bg-black text-white border-2 border-white placeholder-gray-300 shadow-[0_0_12px_rgba(255,255,255,0.35)] focus:shadow-[0_0_22px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black";
  const neonPasswordInputClasses = "w-full pl-10 pr-12 py-3 rounded-xl bg-black text-white border-2 border-white placeholder-gray-300 shadow-[0_0_12px_rgba(255,255,255,0.35)] focus:shadow-[0_0_22px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black";
  const neonTextGlow = "filter drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large particles */}
        <div className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{top: '10%', left: '5%', animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" style={{top: '15%', right: '10%', animationDelay: '1s'}}></div>
        <div className="absolute w-4 h-4 bg-indigo-300 rounded-full opacity-40 animate-ping" style={{top: '25%', left: '15%', animationDelay: '2s'}}></div>
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-70 animate-bounce" style={{top: '30%', right: '20%', animationDelay: '0.5s', animationDuration: '4s'}}></div>
        <div className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-50 animate-pulse" style={{top: '40%', left: '8%', animationDelay: '3s'}}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 animate-ping" style={{top: '45%', right: '5%', animationDelay: '1.5s'}}></div>
        
        {/* Medium particles */}
        <div className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-60 animate-bounce" style={{bottom: '35%', left: '12%', animationDelay: '2.5s', animationDuration: '5s'}}></div>
        <div className="absolute w-3 h-3 bg-emerald-400 rounded-full opacity-40 animate-pulse" style={{bottom: '40%', right: '15%', animationDelay: '4s'}}></div>
        <div className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-80 animate-ping" style={{bottom: '50%', left: '20%', animationDelay: '0.8s'}}></div>
        <div className="absolute w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-bounce" style={{bottom: '25%', right: '25%', animationDelay: '3.5s', animationDuration: '3.5s'}}></div>
        
        {/* Small particles */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse" style={{top: '60%', left: '25%', animationDelay: '1.2s'}}></div>
        <div className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-80 animate-ping" style={{top: '70%', right: '30%', animationDelay: '2.8s'}}></div>
        <div className="absolute w-2 h-2 bg-violet-300 rounded-full opacity-45 animate-bounce" style={{top: '80%', left: '30%', animationDelay: '4.2s', animationDuration: '6s'}}></div>
        <div className="absolute w-1 h-1 bg-cyan-200 rounded-full opacity-60 animate-pulse" style={{bottom: '15%', left: '35%', animationDelay: '5s'}}></div>
        <div className="absolute w-2 h-2 bg-orange-300 rounded-full opacity-50 animate-ping" style={{bottom: '20%', right: '8%', animationDelay: '1.8s'}}></div>
        
        {/* Extra floating particles */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 animate-bounce" style={{top: '35%', left: '45%', animationDelay: '3.2s', animationDuration: '4.5s'}}></div>
        <div className="absolute w-3 h-3 bg-teal-400 rounded-full opacity-35 animate-pulse" style={{top: '55%', right: '40%', animationDelay: '6s'}}></div>
        <div className="absolute w-2 h-2 bg-rose-300 rounded-full opacity-55 animate-ping" style={{bottom: '60%', left: '50%', animationDelay: '2.2s'}}></div>
        <div className="absolute w-1 h-1 bg-lime-300 rounded-full opacity-75 animate-bounce" style={{bottom: '45%', right: '45%', animationDelay: '4.8s', animationDuration: '3.8s'}}></div>
        <div className="absolute w-2 h-2 bg-amber-400 rounded-full opacity-40 animate-pulse" style={{top: '85%', left: '60%', animationDelay: '7s'}}></div>
        
        {/* Corner particles */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 animate-ping" style={{top: '5%', left: '90%', animationDelay: '1.5s'}}></div>
        <div className="absolute w-2 h-2 bg-sky-300 rounded-full opacity-50 animate-bounce" style={{top: '90%', left: '5%', animationDelay: '5.5s', animationDuration: '4s'}}></div>
        <div className="absolute w-1 h-1 bg-fuchsia-300 rounded-full opacity-70 animate-pulse" style={{top: '5%', right: '5%', animationDelay: '8s'}}></div>
        <div className="absolute w-3 h-3 bg-emerald-200 rounded-full opacity-30 animate-ping" style={{bottom: '5%', right: '90%', animationDelay: '3.8s'}}></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        {/* Main Auth Card */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 dark:backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              {isSignUp ? (
                <UserPlus className="w-10 h-10 text-white" />
              ) : (
                <LogIn className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {isMagicLink ? t('auth.signInWithMagic') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {isMagicLink
                ? t('auth.enterEmailForMagic')
                : isSignUp
                ? t('auth.joinGallery')
                : t('auth.signInToAccess')}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-6">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <button
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className={`${neonButtonClasses} ${neonTextGlow}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className={`font-medium text-white ${neonTextGlow}`}>Continue with Google</span>
              </button>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Super Recommended
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className={`${neonButtonClasses} ${neonTextGlow}`}
              >
                <Github className={`w-5 h-5 text-white ${neonTextGlow}`} />
                <span className={`font-medium text-white ${neonTextGlow}`}>Continue with GitHub</span>
              </button>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Super Recommended
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-black text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={neonInputClasses}
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={neonInputClasses}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password (hidden for magic links) */}
            {!isMagicLink && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={neonPasswordInputClasses}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-900 text-white font-medium py-3 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.55)] hover:shadow-[0_0_22px_rgba(255,255,255,0.9)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isMagicLink ? 'Sending Magic Link...' : isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </span>
                </>
              ) : (
                <span>
                  {isMagicLink ? t('auth.signInWithMagic') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
                </span>
              )}
            </button>
          </form>

          {/* Forgot Password Link - only show for password sign in */}
          {!isMagicLink && !isSignUp && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowPasswordReset(true)}
                disabled={isLoading}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50 text-sm"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}

          {/* Mode Switch */}
          <div className="mt-8 text-center space-y-4">
            {!isMagicLink && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                </p>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                    setEmail('');
                    setPassword('');
                    setFullName('');
                  }}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2 justify-center">
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.or')}</span>
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
            </div>
            
            <button
              onClick={() => {
                setIsMagicLink(!isMagicLink);
                setIsSignUp(false);
                setError(null);
                setSuccess(null);
                setPassword('');
                setFullName('');
              }}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {isMagicLink ? t('auth.usePasswordInstead') : t('auth.signInWithMagic')}
            </button>
          </div>

          {/* Help Text */}
          {isSignUp && !isMagicLink && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                {t('auth.byCreatingAccount')}
              </p>
            </div>
          )}
          
          {isMagicLink && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                {t('auth.magicLinkDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
