# NM GUARD BETA Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React Frontend - Vite)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ User clicks "Generate" button
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MediaDetailModal.tsx                         │
│  1. Check access with NM GUARD BETA                            │
│  2. If allowed → Generate caption                               │
│  3. Record usage                                                │
│  4. Auto-save caption                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Calls
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│              │  │   NM GUARD BETA  │  │              │
│  Supabase    │  │   (Render.com)   │  │ AI Caption   │
│   Database   │  │                  │  │   Service    │
│              │  │  Rate Limiting   │  │              │
└──────────────┘  └──────────────────┘  └──────────────┘
       │                    │
       │                    │ Queries user role & usage
       │                    │
       └────────────────────┘
```

## Request Flow

### Scenario 1: Normal User (Within Limit)

```
User clicks "Generate"
        │
        ▼
Check with NM GUARD BETA
        │
        ├─→ Query Supabase profiles → is_admin = false
        │
        └─→ Query ai_caption_usage → count = 0
        │
        ▼
Response: { allowed: true, remaining: 2 }
        │
        ▼
Toast: "2 AI captions remaining today"
        │
        ▼
Generate AI Caption
        │
        ▼
Record usage in ai_caption_usage → count = 1
        │
        ▼
Auto-save caption
        │
        ▼
Toast: "Caption saved!"
```

### Scenario 2: Normal User (Limit Exceeded)

```
User clicks "Generate"
        │
        ▼
Check with NM GUARD BETA
        │
        ├─→ Query Supabase profiles → is_admin = false
        │
        └─→ Query ai_caption_usage → count = 2
        │
        ▼
Response: { allowed: false, reason: "Daily limit reached..." }
        │
        ▼
Toast: "❌ Daily limit of 2 AI captions reached..."
        │
        ▼
Stop (no caption generated)
```

### Scenario 3: Admin/Tester User

```
User clicks "Generate"
        │
        ▼
Check with NM GUARD BETA
        │
        └─→ Query Supabase profiles → is_admin = true
        │
        ▼
Response: { allowed: true, remaining: Infinity, role: "admin" }
        │
        ▼
Generate AI Caption (no toast about limits)
        │
        ▼
Auto-save caption
        │
        ▼
Toast: "Caption saved!"
        │
        └─→ Usage NOT recorded (admins don't count)
```

## Database Schema

```sql
┌─────────────────────────────────────────────┐
│         ai_caption_usage Table              │
├─────────────────────────────────────────────┤
│ id              UUID (PK)                   │
│ user_id         UUID (FK → auth.users)      │
│ count           INTEGER (default 1)         │
│ created_at      TIMESTAMPTZ                 │
│ updated_at      TIMESTAMPTZ                 │
└─────────────────────────────────────────────┘
         │
         │ References
         ▼
┌─────────────────────────────────────────────┐
│           auth.users Table                  │
├─────────────────────────────────────────────┤
│ id              UUID (PK)                   │
│ email           VARCHAR                     │
│ ...                                         │
└─────────────────────────────────────────────┘
         │
         │ Extended by
         ▼
┌─────────────────────────────────────────────┐
│           profiles Table                    │
├─────────────────────────────────────────────┤
│ id              UUID (PK)                   │
│ is_admin        BOOLEAN (default false)     │
│ email           VARCHAR                     │
│ full_name       VARCHAR                     │
│ avatar_url      TEXT                        │
│ ...                                         │
└─────────────────────────────────────────────┘
```

## API Endpoints

### NM GUARD BETA Service

```
┌──────────────────────────────────────────────────────────────────┐
│  POST /api/guard/check-caption-access                            │
│  ────────────────────────────────────────────────────────────    │
│  Request:  { userId, userEmail? }                                │
│  Response: { allowed, reason?, remaining?, role?, message? }     │
│                                                                  │
│  Logic:                                                          │
│  1. Get user profile from Supabase                               │
│  2. Check if admin/super_admin → Return unlimited                │
│  3. Check if tester (email pattern) → Return unlimited           │
│  4. Query today's usage from ai_caption_usage                    │
│  5. Compare count vs limit (2)                                   │
│  6. Return allowed=true/false with remaining count               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  POST /api/guard/record-caption-usage                            │
│  ────────────────────────────────────────────────────────────    │
│  Request:  { userId }                                            │
│  Response: { success }                                           │
│                                                                  │
│  Logic:                                                          │
│  1. Check if record exists for today                             │
│  2. If exists → Increment count                                  │
│  3. If not → Insert new record with count=1                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  GET /api/guard/stats?userId=xxx                                 │
│  ────────────────────────────────────────────────────────────    │
│  Response: { userId, todayCount, limit, history }                │
│                                                                  │
│  Logic:                                                          │
│  1. Query all records for user today                             │
│  2. Return count and history                                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  GET /health                                                     │
│  ────────────────────────────────────────────────────────────    │
│  Response: { service, status, version, timestamp }               │
└──────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Client)                      │
│  - Can call NM GUARD BETA API                               │
│  - Can call AI Caption Service                              │
│  - CANNOT directly access service role key                  │
│  - CANNOT bypass rate limiting                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   NM GUARD BETA (Server)                    │
│  - Has service role key (server-side only)                  │
│  - Can read/write ai_caption_usage table                    │
│  - Can read profiles table                                  │
│  - Validates all requests                                   │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Service Role Auth
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  - RLS enabled on ai_caption_usage                          │
│  - Users can view own usage                                 │
│  - Admins can view all usage                                │
│  - Service role bypasses RLS (for NM GUARD)                 │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Setup                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Vercel     │         │  Render.com  │         │  Supabase    │
│              │         │              │         │              │
│  Frontend    │◄───────►│  NM GUARD    │◄───────►│  Database    │
│  React App   │  HTTPS  │  BETA        │  API    │  PostgreSQL  │
│              │         │  Express.js  │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
   Port 443              Port 10000                  Port 5432
   (HTTPS)                                          (Internal)

Environment Variables:
- Vercel:   VITE_NM_GUARD_URL=https://nm-guard-beta.onrender.com
- Render:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Supabase: (Managed service)
```

## Rate Limiting Logic

```javascript
// Pseudo-code for rate limiting decision

async function checkAccess(userId, userEmail) {
  // Step 1: Check if user is admin
  profile = await getProfile(userId);
  
  if (profile.is_admin === true) {
    return { allowed: true, role: 'admin', remaining: Infinity };
  }
  
  if (isTester(userEmail)) {
    return { allowed: true, role: 'tester', remaining: Infinity };
  }
  
  // Step 2: Check usage
  today = startOfDay(new Date());
  usage = await getUsageToday(userId, today);
  
  const LIMIT = 2;
  const currentCount = usage?.count || 0;
  
  if (currentCount >= LIMIT) {
    return {
      allowed: false,
      role: 'user',
      remaining: 0,
      reason: `Daily limit of ${LIMIT} AI captions reached. Try again tomorrow.`
    };
  }
  
  return {
    allowed: true,
    role: 'user',
    remaining: LIMIT - currentCount,
    message: `${LIMIT - currentCount} AI captions remaining today`
  };
}
```

## Error Handling & Fail-Safe

```
┌─────────────────────────────────────────────────┐
│  What happens if NM GUARD BETA is down?        │
└─────────────────────────────────────────────────┘

Frontend aiClient.ts logic:

try {
  response = await fetch(NM_GUARD_URL + '/check-access');
  return response.json();
} catch (error) {
  console.error('NM GUARD unavailable');
  
  // FAIL OPEN - Allow access
  // Better to let users use the feature than block everyone
  return { 
    allowed: true, 
    message: 'Guard service unavailable' 
  };
}

This ensures:
✅ Service downtime doesn't break the app
✅ Users can still use AI Captioner
✅ Legitimate users aren't blocked
⚠️  Rate limiting temporarily disabled during outage
```

## Performance Considerations

```
Typical Request Latency:

Frontend → NM GUARD:        ~50-200ms (API call)
NM GUARD → Supabase:        ~20-100ms (database query)
Frontend → AI Caption:      ~2-5 seconds (image analysis)
Total perceived delay:      +50-200ms (negligible)

Optimization strategies:
- Parallel requests (check + caption generation)
- Caching user role in session (future enhancement)
- Database indexes on (user_id, created_at)
- Connection pooling in NM GUARD
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────┐
│  Key Metrics to Monitor                         │
└─────────────────────────────────────────────────┘

1. Request Rate
   - Requests per minute to /check-caption-access
   - Identify traffic spikes

2. Denial Rate
   - % of requests denied (should be low initially)
   - High denial rate = many users hitting limit

3. Error Rate
   - 500 errors from NM GUARD
   - Database connection failures

4. Response Time
   - P50, P95, P99 latencies
   - Target: < 200ms for check-access

5. Usage Patterns
   - Most active hours
   - Users hitting limits frequently
   - Admin vs normal user ratio

Monitor via:
- Render Dashboard → Logs
- Supabase Dashboard → Database Activity
- Browser Console (frontend errors)
```

---

## Quick Reference

**Check if user can use AI Captioner:**
```bash
curl -X POST http://localhost:3001/api/guard/check-caption-access \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid"}'
```

**Record usage:**
```bash
curl -X POST http://localhost:3001/api/guard/record-caption-usage \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid"}'
```

**Get stats:**
```bash
curl http://localhost:3001/api/guard/stats?userId=user-uuid
```

**Health check:**
```bash
curl http://localhost:3001/health
```
