-- Helferportal Content Editor — Supabase Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Pages table — stores content JSON per page
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,              -- 'startseite', 'hilfe-finden', etc.
  title TEXT NOT NULL,              -- 'Startseite', 'Hilfe finden', etc.
  url TEXT NOT NULL DEFAULT '/',    -- '/', '/hilfe-finden.html', etc.
  content JSONB NOT NULL DEFAULT '{"blocks":[]}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT NULL      -- email of last editor
);

-- 2. Auto-update timestamp on save
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- 3. Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 4. Allow authenticated users to read/write
CREATE POLICY "Authenticated users can read pages"
  ON pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');
