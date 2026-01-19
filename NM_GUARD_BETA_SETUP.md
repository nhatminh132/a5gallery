# NM GUARD BETA Setup Guide

## What is NM GUARD BETA?

NM GUARD BETA is a logic bot service that manages AI Captioner rate limiting:
- **Normal users**: 2 AI captions per day
- **Admin & Testers**: Unlimited access
- **Hosted on Render**: Separate microservice for scalability

## Quick Setup

### 1. Database Migration

Run the migration to create the tracking table:

```bash
# Apply the migration in your Supabase project
supabase/migrations/20260119000000_create_ai_caption_usage_table.sql
```

Or apply it via Supabase Dashboard → SQL Editor.

### 2. Local Development

```bash
# Navigate to ai-utility-server
cd ai-utility-server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add:
# - SUPABASE_URL (your Supabase project URL)
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)

# Start NM GUARD BETA
npm start
# Service will run on http://localhost:3001
```

### 3. Configure Frontend

Add to your main project `.env`:

```env
VITE_NM_GUARD_URL=http://localhost:3001
```

### 4. Test Locally

1. Start the dev server: `npm run dev`
2. Open an image in the gallery
3. Click "Generate" to test AI Caption
4. You should see: "2 AI captions remaining today"

## Deploy to Render

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### Step 2: Configure Service

**Basic Settings:**
- **Name**: `nm-guard-beta`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `cd ai-utility-server && npm install`
- **Start Command**: `cd ai-utility-server && node nm-guard-beta.js`

### Step 3: Environment Variables

Add these in Render Dashboard → Environment:

| Key | Value |
|-----|-------|
| `NM_GUARD_PORT` | `10000` (or leave empty for Render default) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key ⚠️ Keep secret! |

**Where to find these:**
- Supabase URL: `https://[project-id].supabase.co`
- Service Role Key: Supabase Dashboard → Settings → API → `service_role` key

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Copy your service URL: `https://nm-guard-beta.onrender.com`

### Step 5: Update Frontend

Update your main project `.env`:

```env
VITE_NM_GUARD_URL=https://nm-guard-beta.onrender.com
```

Commit and redeploy your frontend.

## Verify Deployment

### Health Check

```bash
curl https://nm-guard-beta.onrender.com/health
```

Expected response:
```json
{
  "service": "NM GUARD BETA",
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2026-01-19T14:00:00.000Z"
}
```

### Test Access Check

```bash
curl -X POST https://nm-guard-beta.onrender.com/api/guard/check-caption-access \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

## User Roles

### Making a User a Tester

Option 1: **Email Pattern**
- Email contains "tester": `john.tester@example.com`
- Email contains "test@": `test@example.com`
- Email ends with `@nmguard.test`: `alice@nmguard.test`

Option 2: **Database Update**
```sql
-- Make user an admin (unlimited AI captions)
UPDATE profiles 
SET is_admin = true
WHERE email = 'user@example.com';
```

## Rate Limit Configuration

Current limits in `nm-guard-beta.js`:

```javascript
const RATE_LIMITS = {
  NORMAL_USER_DAILY: 2,      // Change this to adjust normal user limit
  ADMIN_DAILY: Infinity,
  TESTER_DAILY: Infinity
};
```

To change limits, edit the file and redeploy.

## Monitoring

### View User Stats

```bash
curl "https://nm-guard-beta.onrender.com/api/guard/stats?userId=USER_ID"
```

### Check Render Logs

1. Go to Render Dashboard
2. Click on your `nm-guard-beta` service
3. Click **"Logs"** tab
4. Monitor requests and errors

## Troubleshooting

### Issue: "NM GUARD BETA not configured"

**Symptom**: Console warning, all users have unlimited access

**Solution**: 
```bash
# Add to .env
VITE_NM_GUARD_URL=https://nm-guard-beta.onrender.com

# Restart dev server
npm run dev
```

### Issue: Service returns 500 error

**Check:**
1. Are Supabase credentials correct?
2. Did you run the database migration?
3. Check Render logs for specific error

### Issue: Render service is sleeping

**Symptom**: First request takes 30+ seconds

**Solutions:**
- Upgrade to paid Render plan (recommended for production)
- Implement keep-alive ping every 10 minutes
- Accept cold start delay on free tier

### Issue: All users getting "access denied"

**Check:**
1. Database migration ran successfully
2. `ai_caption_usage` table exists
3. RLS policies are correct

## Security Notes

⚠️ **NEVER expose Service Role Key**
- Keep it server-side only
- Don't commit to Git
- Use environment variables

✅ **Service is secure by default**
- CORS enabled for your frontend
- RLS enabled on database
- No sensitive data exposed to client

## Cost

**Render Free Tier:**
- Service sleeps after 15 minutes of inactivity
- 750 hours/month (enough for one service)
- Cold start: ~30 seconds

**Render Paid:**
- Starts at $7/month
- No sleep, instant responses
- Recommended for production

## Next Steps

After setup:
1. ✅ Test with normal user account (should see "2 remaining")
2. ✅ Test with admin account (should have unlimited)
3. ✅ Test limit enforcement (try 3+ captions in one day)
4. ✅ Monitor Render logs for any errors
5. 🚀 Deploy to production!

## Support

- Full documentation: `ai-utility-server/NM_GUARD_BETA_README.md`
- Service code: `ai-utility-server/nm-guard-beta.js`
- Migration: `supabase/migrations/20260119000000_create_ai_caption_usage_table.sql`

Happy guarding! 🛡️
