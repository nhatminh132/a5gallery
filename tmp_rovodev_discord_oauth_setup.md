# 🎮 Discord OAuth Configuration

## Current Setup Check

### 📍 Where to Check
1. Go to: [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (should be named "A5 Gallery" or similar)
3. Go to OAuth2 tab

### ✅ Required Settings

**Redirects should include:**
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

### 🔧 If You Need to Fix It
1. In OAuth2 tab, find "Redirects" section
2. Add the Supabase callback URL above
3. Remove any localhost URLs if present
4. Save changes

### 🧪 Test Command
After fixing, test with:
- Click Discord sign-in on your live site
- Should redirect to Discord → back to your app

---
**Status: [ ] Checked [ ] Fixed [ ] Tested**