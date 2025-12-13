import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { getDeviceInfo } from '../utils/deviceInfo';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  changeEmail: (newEmail: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear any corrupted storage on app start
  const clearCorruptedStorage = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          try {
            const value = localStorage.getItem(key);
            if (value && (value.includes('undefined') || value === 'undefined' || value === 'null')) {
              console.log('Removing corrupted key:', key);
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.error('Storage cleanup error:', e);
    }
  };

  // Initialize auth
  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initialize = async () => {
      try {
        console.log('🧹 Cleaning storage...');
        clearCorruptedStorage();
        
        console.log('🔍 Getting current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          throw error;
        }
        
        console.log('📊 Session result:', !!session, session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('✅ User found, setting up auth state');
          setSession(session);
          setUser(session.user);
          // Load profile but don't block auth completion
          loadProfile(session.user.id).catch(err => 
            console.warn('Profile load failed (non-blocking):', err)
          );
        } else {
          console.log('❌ No user found, clearing auth state');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
      } catch (error) {
        console.error('💥 Auth init error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Always set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timeout, forcing loading to false');
        setLoading(false);
      }
    }, 3000); // Reduced from 5s to 3s

    // Start initialization
    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          loadProfile(session.user.id).catch(err => 
            console.warn('Profile load failed during sign in:', err)
          );
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        // Always ensure loading is false after auth events
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []); // Remove loading dependency to prevent infinite loop

  const loadProfile = async (userId: string) => {
    console.log('👤 LOAD PROFILE STARTED for:', userId);
    try {
      
      // Try to get existing profile (handle missing columns gracefully)
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📋 Profile query result:', { profile: !!profile, error: error?.message });

      // If no profile exists, create one
      if (!profile) {
        console.log('🏗️ Creating new profile');
        const { data: { user } } = await supabase.auth.getUser();
        
        const newProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('📝 Profile data:', newProfile);

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();

        if (createError) {
          console.error('❌ Profile creation error:', createError);
          console.error('Error details:', createError.details, createError.hint, createError.code);
          
          // Try to throw a more specific error for OAuth callback handling
          throw new Error(`Database error saving new user: ${createError.message}`);
        } else {
          console.log('✅ Profile created:', createdProfile);
          setProfile(createdProfile);
        }
      } else {
        console.log('✅ Profile loaded:', profile);
        // Add is_admin field if missing (for backwards compatibility)
        const profileWithAdmin = {
          ...profile,
          is_admin: profile.is_admin || false
        };
        setProfile(profileWithAdmin);
      }
    } catch (error) {
      console.error('💥 Profile loading error:', error);
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          return { success: true, message: 'Account created and verified successfully! You can now sign in.' };
        } else {
          return { 
            success: true, 
            message: 'Account created! Please check your email and click the confirmation link to activate your account. Check your spam folder if you don\'t see the email.' 
          };
        }
      }

      return { success: false, error: 'Account creation failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Collect and store device information
        try {
          const deviceInfo = await getDeviceInfo();
          await supabase
            .from('profiles')
            .update({
              ip_address: deviceInfo.ip_address,
              device_name: deviceInfo.device_name,
              device_os: deviceInfo.device_os,
              user_agent: deviceInfo.user_agent,
              last_device_update: new Date().toISOString()
            })
            .eq('id', data.user.id);
        } catch (deviceError) {
          console.warn('Failed to update device info:', deviceError);
          // Don't fail sign-in if device info update fails
        }
        
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const clearError = () => {
    // No longer needed since we handle errors directly in components
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      console.log(`🔥 Starting OAuth with ${provider}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(`❌ OAuth ${provider} error:`, error);
        throw error;
      }

      console.log(`✅ OAuth ${provider} initiated`, data);
    } catch (error) {
      console.error(`❌ OAuth ${provider} failed:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Check your email for the magic link to sign in!' 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async (newEmail: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Email change initiated! Please check both your current and new email addresses for confirmation links.' 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Password reset link sent! Check your email and click the link to reset your password. The link will expire in 1 hour.' 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No authenticated user');

    console.log('Updating profile with:', updates);

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }

    // Update local profile state immediately to avoid unnecessary reload
    setProfile(prev => prev ? { ...prev, ...updates } : null);
    
    console.log('Profile updated successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signInWithMagicLink,
      changeEmail,
      resetPassword,
      updateProfile,
      signOut,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;