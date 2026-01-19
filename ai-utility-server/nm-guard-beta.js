/**
 * NM GUARD BETA - AI Captioner Rate Limiting Logic Bot
 * 
 * This service manages access control for AI Captioner feature:
 * - Normal users: 2 requests per day
 * - Admin & Tester: Unlimited requests
 * - Hosted on Render
 */

import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client for checking user roles and tracking usage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limits
const RATE_LIMITS = {
  NORMAL_USER_DAILY: 2,
  ADMIN_DAILY: Infinity,
  TESTER_DAILY: Infinity
};

/**
 * Check if user can use AI Captioner
 * POST /api/guard/check-caption-access
 * Body: { userId: string, userEmail?: string }
 * Response: { allowed: boolean, reason?: string, remaining?: number, role?: string }
 */
app.post('/api/guard/check-caption-access', async (req, res) => {
  try {
    const { userId, userEmail } = req.body;

    if (!userId) {
      return res.status(400).json({
        allowed: false,
        reason: 'User ID is required'
      });
    }

    // 1. Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({
        allowed: false,
        reason: 'Failed to verify user profile'
      });
    }

    // 2. Check if user is admin or tester
    const email = profile?.email || userEmail || '';
    const isAdmin = profile?.is_admin === true;
    const isTester = email.toLowerCase().includes('tester') || 
                     email.toLowerCase().includes('test@') ||
                     email.endsWith('@nmguard.test'); // Special tester domain

    if (isAdmin || isTester) {
      return res.json({
        allowed: true,
        role: isAdmin ? 'admin' : 'tester',
        remaining: Infinity,
        message: 'Unlimited access granted'
      });
    }

    // 3. Check usage for normal users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: usage, error: usageError } = await supabase
      .from('ai_caption_usage')
      .select('count')
      .eq('user_id', userId)
      .gte('created_at', todayISO)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking usage:', usageError);
      return res.status(500).json({
        allowed: false,
        reason: 'Failed to check usage limits'
      });
    }

    const currentCount = usage?.count || 0;
    const limit = RATE_LIMITS.NORMAL_USER_DAILY;

    if (currentCount >= limit) {
      return res.json({
        allowed: false,
        role: 'user',
        remaining: 0,
        reason: `Daily limit of ${limit} AI captions reached. Try again tomorrow or upgrade to premium.`,
        resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return res.json({
      allowed: true,
      role: 'user',
      remaining: limit - currentCount,
      message: `${limit - currentCount} AI captions remaining today`
    });

  } catch (error) {
    console.error('NM GUARD BETA error:', error);
    return res.status(500).json({
      allowed: false,
      reason: 'Internal server error'
    });
  }
});

/**
 * Record AI caption usage
 * POST /api/guard/record-caption-usage
 * Body: { userId: string }
 * Response: { success: boolean }
 */
app.post('/api/guard/record-caption-usage', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check if there's already a record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: existing, error: fetchError } = await supabase
      .from('ai_caption_usage')
      .select('id, count')
      .eq('user_id', userId)
      .gte('created_at', todayISO)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching usage:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch usage record'
      });
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('ai_caption_usage')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating usage:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update usage record'
        });
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('ai_caption_usage')
        .insert({
          user_id: userId,
          count: 1,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting usage:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to record usage'
        });
      }
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('Error recording usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get usage statistics (admin only)
 * GET /api/guard/stats?userId=xxx
 */
app.get('/api/guard/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('ai_caption_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    return res.json({
      userId,
      todayCount: data[0]?.count || 0,
      limit: RATE_LIMITS.NORMAL_USER_DAILY,
      history: data
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    service: 'NM GUARD BETA',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.NM_GUARD_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🛡️  NM GUARD BETA is running on port ${PORT}`);
  console.log(`📊 Rate limits: Normal users = ${RATE_LIMITS.NORMAL_USER_DAILY}/day`);
});
