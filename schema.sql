-- Database Schema and Row-Level Security (RLS) setup for Zero-Knowledge JSON Share
-- Run these commands in the Supabase SQL Editor (https://supabase.com) for your project.

-- 1. Create the json_formatter_snippets table
CREATE TABLE IF NOT EXISTS public.json_formatter_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_content TEXT NOT NULL,
    iv TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'json',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ -- Optional: support auto-expiring links
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.json_formatter_snippets ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anonymous users to insert snippets
CREATE POLICY "Allow anonymous inserts" ON public.json_formatter_snippets
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- 4. Policy: Allow anonymous users to fetch a snippet by its unique UUID ID
CREATE POLICY "Allow anonymous read access by ID" ON public.json_formatter_snippets
    FOR SELECT 
    TO anon
    USING (true);

-- 5. Prevent updates and deletions by anonymous users (Implicit because no update/delete policy is defined)

-- 6. Optional: Setup automatic cleanup of expired snippets
-- (Requires pg_cron extension, which is enabled by default in Supabase under extensions)
--
-- CREATE OR REPLACE FUNCTION public.purge_expired_snippets()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM public.json_formatter_snippets WHERE expires_at IS NOT NULL AND expires_at < now();
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- SELECT cron.schedule('purge-expired-snippets', '0 * * * *', 'SELECT public.purge_expired_snippets()');
