# 🚀 Complete Supabase Production Setup Guide

## Step 1: Configure Supabase Authentication URLs

### 🔗 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com/project/rtsdqkhosqeptvxpatay)
2. Navigate to **Authentication** → **URL Configuration**

### 🌐 Update Site URL
**Current**: `http://localhost:5173`
**Change to**: Your main production URL

Example:
```
https://your-main-app.vercel.app
```

### ↩️ Update Redirect URLs
**Current**: `http://localhost:5173/**`
**Add these patterns**:
```
http://localhost:5173/**
https://your-main-app.vercel.app/**
https://your-staging-app.vercel.app/**
https://*.vercel.app/**
```

---

## Step 2: Update Each OAuth Provider

### 🔐 Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → Your OAuth Client
3. **Authorized redirect URIs** - Add:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```
4. **Keep existing localhost URL** for development

### 🐙 GitHub OAuth Settings  
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Your OAuth App → Edit
3. **Authorization callback URL**:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```

### 🎮 Discord OAuth Settings
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Your App → OAuth2 → Redirects
3. **Add redirect**:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```

### 🎵 Spotify OAuth Settings
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Your App → Edit Settings
3. **Redirect URIs** - Add:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```

---

## Step 3: Environment Variables for Production

Create these environment variables in **Vercel Dashboard**:

```env
VITE_SUPABASE_URL=https://rtsdqkhosqeptvxpatay.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2Rxa2hvc3FlcHR2eHBhdGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzY2MTYsImV4cCI6MjA4MDQxMjYxNn0.gzdRYISLRlefYP0Yv3yXL95rv5Di2RKDhRaEu9x-n3c
```

---

## Step 4: Testing Checklist

### ✅ Test Each Provider:
1. **Deploy to Vercel**
2. **Visit your live site**
3. **Click each OAuth button**:
   - [ ] Google OAuth
   - [ ] GitHub OAuth  
   - [ ] Discord OAuth
   - [ ] Spotify OAuth
4. **Verify redirect flow**:
   - Redirects to provider ✅
   - Completes OAuth ✅
   - Redirects back to your app ✅
   - User is signed in ✅

### 🔍 Troubleshooting
If OAuth fails:
1. **Check browser console** for error messages
2. **Verify redirect URLs** match exactly
3. **Check Supabase logs** in Dashboard → Logs
4. **Test one provider at a time**

---

## 🚨 Critical Points

1. **Supabase callback URL** is the ONLY URL your OAuth providers need
2. **Your app domains** are configured in Supabase, not in OAuth providers
3. **Keep localhost URLs** for local development
4. **Test thoroughly** after each change

---

## 🆘 Quick Fix Summary

**The core issue**: OAuth providers redirect to localhost because they're not configured for production.

**The solution**: 
1. Update Supabase Site URL to your production domain
2. Add production domains to Supabase Redirect URLs  
3. Update each OAuth provider to use Supabase callback URL
4. Test on live deployment