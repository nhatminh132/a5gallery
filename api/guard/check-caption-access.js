/**
 * Check Caption Access (Vercel Serverless)
 * Checks if user can use AI Captioner
 * GLOBAL LIMIT: 10 captions/day for ALL normal users combined
 * ADMINS: Unlimited
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GLOBAL_DAILY_LIMIT = 10; // Total captions per day for all normal users

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        allowed: false,
        reason: 'User ID is required'
      });
    }

    // 1. Get user profile to check if admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({
        allowed: false,
        reason: 'Failed to verify user profile'
      });
    }

    const isAdmin = profile?.is_admin === true;

    // 2. Admins have unlimited access
    if (isAdmin) {
      return res.json({
        allowed: true,
        isAdmin: true,
        remaining: Infinity,
        globalUsed: 0,
        globalLimit: Infinity
      });
    }

    // 3. Check GLOBAL usage for today (all normal users combined)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Count total captions used today by all non-admin users
    const { count: globalCount, error: countError } = await supabase
      .from('ai_caption_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (countError) {
      console.error('Error checking global usage:', countError);
      return res.status(500).json({
        allowed: false,
        reason: 'Failed to check global usage limits'
      });
    }

    const globalUsed = globalCount || 0;

    // 4. Check if global limit reached
    if (globalUsed >= GLOBAL_DAILY_LIMIT) {
      return res.json({
        allowed: false,
        isAdmin: false,
        remaining: 0,
        globalUsed: globalUsed,
        globalLimit: GLOBAL_DAILY_LIMIT,
        reason: `Global daily limit of ${GLOBAL_DAILY_LIMIT} AI captions reached. Try again tomorrow.`
      });
    }

    // 5. User can still use the service
    return res.json({
      allowed: true,
      isAdmin: false,
      remaining: GLOBAL_DAILY_LIMIT - globalUsed,
      globalUsed: globalUsed,
      globalLimit: GLOBAL_DAILY_LIMIT
    });

  } catch (error) {
    console.error('Caption access check error:', error);
    return res.status(500).json({
      allowed: false,
      reason: 'Internal server error'
    });
  }
}
