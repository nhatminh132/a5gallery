# How to Run the Database Migration

## Option 1: Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
   - Go to: https://app.supabase.com/project/rtsdqkhosqeptvxpatay

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" to create a new SQL script

3. **Copy and Paste the Migration**
   - Open the file `fix_storage_provider_column.sql` 
   - Copy all the contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click the "Run" button (or press Ctrl+Enter)
   - You should see "Success. No rows returned" message

5. **Verify the Migration**
   - The migration includes a verification query at the bottom
   - Uncomment the last SELECT statement and run it to confirm

## Option 2: Supabase CLI (If you have it installed)

```bash
supabase db push --db-url "your-database-connection-string"
```

## Option 3: Direct Database Connection

If you have direct database access:

```bash
psql "your-postgres-connection-string" -f fix_storage_provider_column.sql
```

## What This Migration Does

✅ **Adds `storage_provider` column** with default value 'storage1'  
✅ **Updates existing records** to use the default storage provider  
✅ **Makes the column required** (NOT NULL constraint)  
✅ **Adds database index** for better query performance  
✅ **Adds validation constraint** to ensure only valid storage provider values  
✅ **Adds documentation** with a helpful column comment  

## After Running the Migration

Once you've successfully run this migration:

1. **Refresh your website** - The upload error should be fixed
2. **Test file upload** - Try uploading a file to confirm it works
3. **Check the browser console** - There should be no more database errors

## Troubleshooting

**If you get an error:**
- Make sure you're connected to the correct database
- Check that you have sufficient permissions
- Verify the `media` table exists

**If uploads still fail:**
- Clear your browser cache and reload
- Check for any other console errors
- Verify your Supabase configuration

**Need help?** Let me know what error message you see and I can help troubleshoot!