# 🔐 Complete OAuth Providers Checklist

## 🎯 The Universal Fix

**ALL providers need the same callback URL:**
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

## 📋 Provider-by-Provider Checklist

### ✅ Google OAuth
- **Location**: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
- **Setting**: "Authorized redirect URIs"
- **Status**: [ ] Checked [ ] Fixed [ ] Tested

### ✅ GitHub OAuth  
- **Location**: [GitHub Developer Settings](https://github.com/settings/developers)
- **Setting**: "Authorization callback URL"
- **Status**: [ ] Checked [ ] Fixed [ ] Tested

### ✅ Discord OAuth
- **Location**: [Discord Developer Portal](https://discord.com/developers/applications)
- **Setting**: OAuth2 → "Redirects"
- **Status**: [ ] Checked [ ] Fixed [ ] Tested

### ✅ Spotify OAuth
- **Location**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- **Setting**: Edit Settings → "Redirect URIs"
- **Status**: [ ] Checked [ ] Fixed [ ] Tested

## 🚀 Efficient Approach

### Option 1: Fix All Now
- Check all 4 providers
- Update all callback URLs
- Test all when Vercel deployment completes

### Option 2: Fix One-by-One
- Start with Google (since you tested it)
- Move to GitHub, Discord, Spotify
- Test each after Vercel routing is fixed

## ⚡ Quick Action Plan

1. **Google**: Already working, just needs the callback URL fix
2. **GitHub**: Likely needs same fix as Google
3. **Discord**: Probably not configured yet
4. **Spotify**: Probably not configured yet

---

**Which provider would you like to tackle first while we wait for Vercel?**