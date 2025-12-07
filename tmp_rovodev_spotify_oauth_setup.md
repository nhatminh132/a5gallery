# 🎵 Spotify OAuth Configuration

## Current Setup Check

### 📍 Where to Check
1. Go to: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app (should be named "A5 Gallery" or similar)
3. Click "Edit Settings"

### ✅ Required Settings

**Redirect URIs should include:**
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### 🔧 If You Need to Fix It
1. In app settings, find "Redirect URIs"
2. Add the Supabase callback URL above
3. Remove any localhost URLs if no longer needed
4. Save settings

### 🧪 Test Command
After fixing, test with:
- Click Spotify sign-in on your live site
- Should redirect to Spotify → back to your app

---
**Status: [ ] Checked [ ] Fixed [ ] Tested**