# ⚡ Immediate OAuth Fix Checklist

## 🎯 The Root Cause
Your OAuth providers are configured with `localhost:5173` but need your production Vercel URLs.

## 📝 What I Need From You
Please provide:
1. **Production URL**: `https://your-production-app.vercel.app`
2. **Staging URL**: `https://your-staging-app.vercel.app` 
3. **Any custom domains** you're using

## 🚀 Quick Fix Order (Do These in Order)

### 1. First: Update Supabase (5 minutes)
- [ ] Go to [Supabase Dashboard](https://app.supabase.com/project/rtsdqkhosqeptvxpatay/auth/url-configuration)
- [ ] Change **Site URL** from `localhost:5173` to your main production URL
- [ ] Add your Vercel URLs to **Redirect URLs**
- [ ] Save changes

### 2. Then: Update OAuth Providers (10 minutes each)
- [ ] **Google**: Add `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`
- [ ] **GitHub**: Update callback URL to same Supabase URL  
- [ ] **Discord**: Add same Supabase URL to redirects
- [ ] **Spotify**: Add same Supabase URL to redirect URIs

### 3. Finally: Test (5 minutes)
- [ ] Deploy to Vercel
- [ ] Test each OAuth button on live site
- [ ] Verify users can sign in and stay signed in

## ⏱️ Expected Time: 30 minutes total

## 🔄 Once You Share URLs
I'll provide:
1. **Exact Supabase configuration** with your URLs
2. **Copy-paste ready** OAuth provider settings
3. **Verification commands** to test everything works

---

**Ready when you are!** Share your Vercel URLs and I'll give you the exact configuration for each step.