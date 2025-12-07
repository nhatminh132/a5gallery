import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface VerificationHookResult {
  verifyMedia: (mediaId: string, notes?: string) => Promise<boolean>;
  rejectMedia: (mediaId: string, notes?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useVerification(): VerificationHookResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const verifyMedia = async (mediaId: string, notes?: string): Promise<boolean> => {
    if (!user?.is_admin) {
      setError('Only admins can verify media');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase
        .rpc('verify_media', {
          media_id: mediaId,
          admin_id: user.id,
          notes: notes || null
        });

      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        console.log('✅ Media verified:', mediaId);
        return true;
      } else {
        throw new Error(data?.message || 'Verification failed');
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setError(err.message || 'Failed to verify media');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectMedia = async (mediaId: string, notes?: string): Promise<boolean> => {
    if (!user?.is_admin) {
      setError('Only admins can reject media');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase
        .rpc('reject_media', {
          media_id: mediaId,
          admin_id: user.id,
          notes: notes || 'Content rejected by admin'
        });

      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        console.log('✅ Media rejected:', mediaId);
        return true;
      } else {
        throw new Error(data?.message || 'Rejection failed');
      }
    } catch (err: any) {
      console.error('❌ Rejection error:', err);
      setError(err.message || 'Failed to reject media');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    verifyMedia,
    rejectMedia,
    loading,
    error
  };
}