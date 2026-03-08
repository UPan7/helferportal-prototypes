-- Migration: Add user tracking to feedback table for chat panel
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Add columns
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- 3. Drop old RLS policies (names from supabase-setup.sql)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Service role reads feedback" ON public.feedback;

-- 4. New RLS policies
-- Authenticated users: insert with their own user_id
CREATE POLICY "auth_insert_feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authenticated users: read their own messages only
CREATE POLICY "auth_select_own_feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Anon users: insert only (backward compat, no user_id)
CREATE POLICY "anon_insert_feedback" ON public.feedback
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- Service role: read everything (admin dashboard)
CREATE POLICY "service_select_all_feedback" ON public.feedback
  FOR SELECT TO service_role USING (true);
