/**
 * Record Caption Usage (Vercel Serverless)
 * Records that user has generated an AI caption
 * Simply inserts a new row - each row = 1 caption generated
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        success: false,
        error: 'User ID is required'
      });
    }

    // Simply insert a new record (each row = 1 caption generated)
    const { error: insertError } = await supabase
      .from('ai_caption_usage')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error recording usage:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record usage'
      });
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('Error recording usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
