const SUPABASE_URL = 'https://vfhibolzkryzcwjswvle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaGlib2x6a3J5emN3anN3dmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDAzNDksImV4cCI6MjA4NjIxNjM0OX0.ThkFOVRqBDbwUMX5mVZbHqlyJc3iKxMQ_6gnJ_BeBnI';

// Clear Supabase session on page load
(async () => {
    try {
        if (window.supabase) {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            await client.auth.signOut();
            console.log('Supabase session cleared');
        }
    } catch (e) {
        console.error('Error clearing session:', e);
    }
})();
