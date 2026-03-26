-- Track auto-generated backend projects
CREATE TABLE IF NOT EXISTS generated_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  schema_name text NOT NULL UNIQUE,
  frontend_html text,
  backend_sql text,
  edge_functions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  supabase_url text,
  supabase_anon_key text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE generated_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access generated_projects" ON generated_projects FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_generated_projects_session ON generated_projects(session_id);
CREATE INDEX idx_generated_projects_conversation ON generated_projects(conversation_id);
