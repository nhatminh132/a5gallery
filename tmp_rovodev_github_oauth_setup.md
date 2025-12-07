# 🐙 GitHub OAuth Configuration

## Current Setup Check

### 📍 Where to Check
1. Go to: [GitHub Developer Settings](https://github.com/settings/developers)
2. Look for your OAuth App (should be named something like "A5 Gallery")

### ✅ Required Settings

**Authorization callback URL should be:**
```
https://rtsdqkhosqeptvxpatay.supabase.co/auth/v1/callback
```

**NOT:**
- ❌ `http://localhost:5173/auth/callback`
- ❌ `https://a5gallery.vercel.app/auth/callback`
- ❌ Any other URL

### 🔧 If You Need to Fix It
1. Edit your GitHub OAuth App
2. Update "Authorization callback URL" to the Supabase URL above
3. Save changes

### 🧪 Test Command
After fixing, test with:
- Click GitHub sign-in on your live site
- Should redirect to GitHub → back to your app (no 404)

---
**Status: [ ] Checked [ ] Fixed [ ] Tested**