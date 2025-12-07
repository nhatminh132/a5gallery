# 🔧 Fix OAuth Redirect Issue for Vercel Deployment

## The Problem
Your OAuth providers are configured with `localhost:5173` redirect URLs, but when deployed on Vercel, the app tries to redirect users back to localhost instead of your live domain.

## Solution: Update OAuth Provider Settings

### 📋 What You Need
1. **Staging URL**: Your Vercel preview deployment URL
2. **Production URL**: Your main Vercel deployment URL  
3. **Custom Domain** (if applicable)

### 🔄 For Each OAuth Provider, Add These Redirect URLs:

#### Redirect URLs to Add:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```
**AND for each Vercel deployment:**
- `https://YOUR-STAGING-URL.vercel.app`
- `https://YOUR-PRODUCTION-URL.vercel.app` 
- `https://YOUR-CUSTOM-DOMAIN.com` (if applicable)

---

## 🔧 Step-by-Step Fix for Each Provider

### 1. 🔐 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project → APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```
5. **Keep the existing localhost URL for local development**

### 2. 🐙 GitHub OAuth  
1. Go to [GitHub Settings → OAuth Apps](https://github.com/settings/developers)
2. Edit your OAuth App
3. Update **Authorization callback URL** to:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```
4. **Note**: GitHub only allows one callback URL, so you might need separate apps for dev/prod

### 3. 🎮 Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → OAuth2
3. In **Redirects**, add:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```

### 4. 🎵 Spotify OAuth
1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. In **Redirect URIs**, add:
   ```
   https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
   ```

---

## ✅ Verification Steps

1. **Deploy your current code to Vercel**
2. **Test each OAuth provider** on your live Vercel URL
3. **Check browser console** for any redirect errors
4. **Verify successful authentication** and redirect back to your app

---

## 🚨 Important Notes

- **Keep localhost URLs** for local development
- **The Supabase callback URL** (`https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`) should be the **primary** redirect URL for all providers
- **Your app URLs** don't need to be added as redirect URLs since Supabase handles the OAuth flow
- **Test thoroughly** after each provider update

---

## 🔍 If Issues Persist

Check:
1. **Supabase Dashboard** → Authentication → URL Configuration
2. **Site URL** should match your production domain
3. **Redirect URLs** should include your Vercel domains
4. **Browser console** for specific OAuth error messages