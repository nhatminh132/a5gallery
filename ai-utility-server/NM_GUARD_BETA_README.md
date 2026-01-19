# NM GUARD BETA - AI Captioner Rate Limiting Service

## Overview

NM GUARD BETA is a logic bot service that manages access control for the AI Captioner feature. It enforces rate limits based on user roles and tracks daily usage.

## Features

- **Rate Limiting**: Normal users can use AI Captioner 2 times per day
- **Unlimited Access**: Admin and Tester users have unlimited access
- **Usage Tracking**: Records all caption requests in the database
- **Role Detection**: Automatically detects user roles from Supabase profiles
- **Fail-Safe**: If the service is unavailable, it fails open (allows access)

## Rate Limits

| User Type | Daily Limit | Detection Method |
|-----------|-------------|------------------|
| Normal User | 2 requests | `is_admin = false` (default) |
| Admin | Unlimited | `is_admin = true` in profiles |
| Tester* | Unlimited | Email pattern matching |

*Tester is identified by email containing "tester", "test@", or ending with "@nmguard.test"

## API Endpoints

### 1. Check Caption Access
**POST** `/api/guard/check-caption-access`

Check if a user can use AI Captioner.

**Request:**
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com" // optional
}
```

**Response:**
```json
{
  "allowed": true,
  "role": "user|admin|tester",
  "remaining": 2,
  "message": "2 AI captions remaining today"
}
```

**Response (limit exceeded):**
```json
{
  "allowed": false,
  "role": "user",
  "remaining": 0,
  "reason": "Daily limit of 2 AI captions reached. Try again tomorrow or upgrade to premium.",
  "resetTime": "2026-01-20T00:00:00.000Z"
}
```

### 2. Record Caption Usage
**POST** `/api/guard/record-caption-usage`

Record that a user has used AI Captioner.

**Request:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Get Usage Statistics
**GET** `/api/guard/stats?userId=uuid`

Get usage statistics for a user (admin only).

**Response:**
```json
{
  "userId": "uuid",
  "todayCount": 2,
  "limit": 2,
  "history": [...]
}
```

### 4. Health Check
**GET** `/health`

Check service health.

**Response:**
```json
{
  "service": "NM GUARD BETA",
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2026-01-19T14:00:00.000Z"
}
```

## Setup

### Local Development

1. **Install dependencies:**
```bash
cd ai-utility-server
npm install
```

2. **Configure environment variables:**
Create `.env` file:
```env
NM_GUARD_PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **Run the migration:**
```bash
# Run the database migration to create the ai_caption_usage table
# Located at: supabase/migrations/20260119000000_create_ai_caption_usage_table.sql
```

4. **Start the service:**
```bash
node nm-guard-beta.js
```

### Deploy to Render

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your GitHub repository**

3. **Configure the service:**
   - **Name**: `nm-guard-beta`
   - **Environment**: `Node`
   - **Build Command**: `cd ai-utility-server && npm install`
   - **Start Command**: `cd ai-utility-server && node nm-guard-beta.js`
   - **Port**: `3001` (or use Render's default)

4. **Add environment variables:**
   - `NM_GUARD_PORT`: `3001`
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep this secret!)

5. **Deploy** and copy the service URL (e.g., `https://nm-guard-beta.onrender.com`)

6. **Update frontend `.env`:**
```env
VITE_NM_GUARD_URL=https://nm-guard-beta.onrender.com
```

## Frontend Integration

The frontend automatically integrates with NM GUARD BETA when configured:

1. Before generating an AI caption, it checks with NM GUARD BETA
2. If allowed, it proceeds with caption generation
3. After successful generation, it records the usage
4. User sees toast notifications about remaining quota

### User Experience

**Normal User (within limit):**
- Clicks "Generate" button
- Sees: "2 AI captions remaining today" (toast notification)
- AI caption is generated and auto-saved

**Normal User (at limit):**
- Clicks "Generate" button
- Sees: "⚠️ Last AI caption for today! (1 remaining)"
- AI caption is generated and auto-saved

**Normal User (exceeded limit):**
- Clicks "Generate" button
- Sees: "Daily limit of 2 AI captions reached. Try again tomorrow or upgrade to premium."
- No caption is generated

**Admin/Tester:**
- Clicks "Generate" button
- AI caption is generated immediately (no limit notifications)

## Database Schema

The service uses the `ai_caption_usage` table:

```sql
CREATE TABLE ai_caption_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- Uses Supabase Service Role Key (server-side only, never exposed to frontend)
- Row Level Security (RLS) enabled on database
- CORS enabled for frontend access
- Fail-safe mode: If service is down, allows access (prevents blocking legitimate users)

## Monitoring

Check service health:
```bash
curl https://nm-guard-beta.onrender.com/health
```

Check user stats:
```bash
curl "https://nm-guard-beta.onrender.com/api/guard/stats?userId=uuid"
```

## Troubleshooting

**Issue**: "NM GUARD BETA not configured"
- **Solution**: Add `VITE_NM_GUARD_URL` to your `.env` file

**Issue**: Service returns 500 error
- **Solution**: Check Supabase credentials and database migration

**Issue**: All users getting unlimited access
- **Solution**: Check that NM GUARD service is running and URL is correct

**Issue**: Render service sleeping
- **Solution**: Upgrade to paid plan or implement keep-alive ping

## Future Enhancements

- [ ] Add premium tier with higher limits
- [ ] Weekly/monthly usage reports
- [ ] Rate limit adjustments per user
- [ ] Webhook notifications for admin
- [ ] Analytics dashboard
- [ ] Grace period for slightly over-limit users

## Support

For issues or questions, please contact the development team or create an issue in the repository.
