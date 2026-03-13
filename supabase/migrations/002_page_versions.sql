-- Page version history: automatic snapshots on every content update
-- Each UPDATE on `pages` saves the OLD row to `page_versions` before overwriting.

CREATE TABLE IF NOT EXISTS page_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id),
  content JSONB NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-snapshot trigger: saves OLD content before UPDATE
CREATE OR REPLACE FUNCTION snapshot_page_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO page_versions (page_id, content, updated_by)
  VALUES (OLD.id, OLD.content, OLD.updated_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_page_version
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_page_version();

-- Fast lookup by page + reverse chronological order
CREATE INDEX idx_page_versions_page_id ON page_versions(page_id, created_at DESC);
