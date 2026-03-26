
CREATE TABLE IF NOT EXISTS user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  collection text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_data_session_collection_idx ON user_data (session_id, collection);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access user_data" ON user_data FOR ALL USING (true) WITH CHECK (true);
