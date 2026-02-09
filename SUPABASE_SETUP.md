# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: unslopmyfeed
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click "Run" to execute the migration
7. Verify tables were created in "Table Editor"

## Step 3: Enable Google OAuth

1. Go to "Authentication" → "Providers" in Supabase dashboard
2. Find "Google" and click to enable it
3. You'll need Google OAuth credentials:

### Get Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Application type: "Web application"
7. Add authorized redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_ID with your actual Supabase project ID)
8. Copy the **Client ID** and **Client Secret**

### Back in Supabase:
1. Paste Google Client ID and Client Secret
2. Click "Save"

## Step 4: Get Your Supabase Keys

1. Go to "Project Settings" → "API" in Supabase
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJxxx...` (long JWT token)

## Step 5: Update Extension Code

1. Open `src/utils/supabase.js`
2. Replace these placeholders:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```
   With your actual values from Step 4

## Step 6: Install Dependencies

```bash
cd /Users/chakravartiavinit/Desktop/unslopmyfeed
npm install @supabase/supabase-js
```

## Step 7: Test Authentication

1. Load the extension in Chrome
2. The auth page should open automatically
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected back and signed in

## Verification

To verify everything is working:

1. Go to Supabase → "Authentication" → "Users"
2. You should see your user listed
3. Go to "Table Editor" → "profiles"
4. Your profile should be automatically created
5. Check "user_settings" table - default settings should exist

## Troubleshooting

**OAuth redirect not working?**
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check browser console for errors

**Tables not created?**
- Re-run the SQL migration
- Check for error messages in SQL Editor

**Can't sign in?**
- Verify Google OAuth is enabled in Supabase
- Check that Client ID and Secret are correct
- Make sure redirect URI is whitelisted

## Next Steps

Once authentication is working:
- Settings will automatically sync to cloud
- Review queue will be stored per-user
- You can sign in on multiple devices with same account
