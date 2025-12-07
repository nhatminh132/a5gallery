# 📝 OAuth Providers Setup Guide for Supabase

## 🚀 Step-by-Step Configuration

### 1. 🔐 Google OAuth Setup

#### A. Create Google OAuth Application
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "A5 Gallery"
   - Authorized redirect URIs: `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`

#### B. Configure in Supabase
1. Go to your [Supabase Dashboard](https://app.supabase.com/project/rtsdqkhosqeptvxpatay)
2. Navigate to "Authentication" > "Providers"
3. Enable "Google" provider
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
5. Save changes

---

### 2. 🐙 GitHub OAuth Setup

#### A. Create GitHub OAuth App
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" > "New OAuth App"
3. Fill in details:
   - **Application name**: A5 Gallery
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Authorization callback URL**: `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`
4. Register application and note down Client ID and Client Secret

#### B. Configure in Supabase
1. In Supabase Dashboard > "Authentication" > "Providers"
2. Enable "GitHub" provider
3. Add your GitHub OAuth credentials:
   - **Client ID**: Your GitHub Client ID
   - **Client Secret**: Your GitHub Client Secret
4. Save changes

---

### 3. 🎮 Discord OAuth Setup

#### A. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name: "A5 Gallery"
4. Go to "OAuth2" tab
5. Add redirect URL: `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

#### B. Configure in Supabase
1. In Supabase Dashboard > "Authentication" > "Providers"
2. Enable "Discord" provider
3. Add your Discord OAuth credentials:
   - **Client ID**: Your Discord Client ID
   - **Client Secret**: Your Discord Client Secret
4. Save changes

---

### 4. 🎵 Spotify OAuth Setup

#### A. Create Spotify App
1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in details:
   - **App name**: A5 Gallery
   - **App description**: Photo gallery application
   - **Redirect URI**: `https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret

#### B. Configure in Supabase
1. In Supabase Dashboard > "Authentication" > "Providers"
2. Enable "Spotify" provider
3. Add your Spotify OAuth credentials:
   - **Client ID**: Your Spotify Client ID
   - **Client Secret**: Your Spotify Client Secret
4. Save changes

---

## 🔧 Important Configuration Notes

### Redirect URLs
**CRITICAL**: For ALL providers, use this exact redirect URL:
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### Development vs Production
- **Development**: Most providers allow `localhost:5173` for testing
- **Production**: Update redirect URLs to your live domain when deploying

### Site URL Configuration
In Supabase Dashboard > "Authentication" > "URL Configuration":
- **Site URL**: `http://localhost:5173` (development) or your live domain
- **Redirect URLs**: Add `http://localhost:5173/**` for development

---

## 🧪 Testing OAuth Integration

### Test Each Provider:
1. **Start your app**: `npm run dev`
2. **Go to sign-in page**: Click any OAuth button
3. **Check browser console** for debug logs starting with 🔥
4. **Verify redirect**: Should redirect to provider's auth page
5. **Complete auth**: Sign in with your account
6. **Check return**: Should redirect back to your app with user logged in

### Debugging Tips:
- **Check console logs** for OAuth errors
- **Verify redirect URLs** match exactly in both provider and Supabase
- **Test one provider at a time** to isolate issues
- **Check Supabase logs** in Dashboard > "Logs"

---

## ✅ Quick Setup Checklist

- [ ] Google OAuth configured
- [ ] GitHub OAuth configured  
- [ ] Discord OAuth configured
- [ ] Facebook OAuth configured
- [ ] Spotify OAuth configured
- [ ] All redirect URLs match
- [ ] Site URL configured in Supabase
- [ ] Tested each provider
- [ ] OAuth buttons working in app

---

## 🆘 Troubleshooting

### Common Issues:
1. **"Invalid redirect URI"**: Check redirect URLs match exactly
2. **"Application not approved"**: Some providers require app review for production
3. **"OAuth error"**: Check client credentials are correct
4. **"CORS error"**: Verify site URL configuration
5. **"Provider not enabled"**: Ensure provider is enabled in Supabase

### Need Help?
- Check Supabase docs: https://supabase.com/docs/guides/auth
- Check provider documentation for specific setup requirements
- Test in browser developer tools for detailed error messages