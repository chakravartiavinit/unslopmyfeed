// Supabase client for the extension
import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values from your Supabase project
const SUPABASE_URL = 'https://vfhibolzkryzcwjswvle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaGlib2x6a3J5emN3anN3dmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDAzNDksImV4cCI6MjA4NjIxNjM0OX0.ThkFOVRqBDbwUMX5mVZbHqlyJc3iKxMQ_6gnJ_BeBnI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

// Helper functions for settings
export async function getUserSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_settings')
        .select('filters, custom_patterns')
        .eq('user_id', user.id)
        .single();

    if (error) throw error;
    return data;
}

export async function updateUserSettings(filters) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_settings')
        .update({ filters, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Helper functions for review queue
export async function getReviewQueue() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('review_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data;
}

export async function addToReviewQueue(text, categories) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('review_queue')
        .insert({
            user_id: user.id,
            text,
            categories
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateReviewQueueItem(id, action) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('review_queue')
        .update({ action })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
