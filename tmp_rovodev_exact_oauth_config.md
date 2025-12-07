# 🎯 Exact OAuth Configuration for a5gallery2-0demo1.vercel.app

## 🚀 Step 1: Update Supabase Authentication Settings

### Go to Supabase Dashboard
1. Visit: [Supabase Authentication Settings](https://app.supabase.com/project/rtsdqkhosqeptvxpatay/auth/url-configuration)

### Update Site URL
**Change from:** `http://localhost:5173`
**Change to:** `https://a5gallery.vercel.app`

### Update Redirect URLs  
**Add these exact URLs:**
```
http://localhost:5173/**
https://a5gallery.vercel.app/**
https://*.vercel.app/**
```

---

## 🔧 Step 2: Update Each OAuth Provider

### 🔐 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. **Authorized redirect URIs** - Add this exact URL:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### 🐙 GitHub OAuth  
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Edit your OAuth App
3. **Authorization callback URL** - Change to:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### 🎮 Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your app → OAuth2
3. **Redirects** - Add:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### 🎵 Spotify OAuth
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. **Redirect URIs** - Add:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

---

## ⚡ Step 3: Test Your Fix

### 1. Deploy Current Code
```bash
# If not auto-deployed, push to your main branch
git add .
git commit -m "OAuth configuration for production"
git push origin main
```

### 2. Test Each Provider
Visit: `https://a5gallery.vercel.app`

**Test each OAuth button:**
- [ ] Google Sign In
- [ ] GitHub Sign In  
- [ ] Discord Sign In
- [ ] Spotify Sign In

**Expected flow:**
1. ✅ Clicks OAuth button
2. ✅ Redirects to provider (Google/GitHub/Discord/Spotify)
3. ✅ User authorizes app
4. ✅ Redirects back to `https://a5gallery.vercel.app` (NOT localhost)
5. ✅ User is successfully signed in

---

## 🔍 Verification Checklist

### ✅ Supabase Settings Updated
- [ ] Site URL: `https://a5gallery.vercel.app`
- [ ] Redirect URLs include your Vercel domain
- [ ] Changes saved

### ✅ OAuth Providers Updated  
- [ ] Google: Supabase callback URL added
- [ ] GitHub: Supabase callback URL set
- [ ] Discord: Supabase callback URL added
- [ ] Spotify: Supabase callback URL added

### ✅ Production Testing
- [ ] Deployed to Vercel
- [ ] Tested on live URL (not localhost)
- [ ] All OAuth providers work
- [ ] Users stay signed in

---

## 🚨 If Issues Persist

### Check Browser Console
Look for errors like:
- `redirect_uri_mismatch`
- `invalid_request`
- OAuth callback errors

### Verify URLs Match Exactly
- Supabase callback: `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`
- No trailing slashes or typos
- HTTPS (not HTTP)

---

## 🎉 Success! 
Once complete, your users will:
- Click OAuth buttons on `https://a5gallery.vercel.app`
- Authenticate with their chosen provider
- Return to your live app (not localhost)
- Be successfully signed in to your gallery