CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  edit_style text NOT NULL DEFAULT 'dinamico',
  lut_id uuid,
  duration_seconds int NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.luts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  preview_gradient text NOT NULL DEFAULT 'linear-gradient(135deg,#ff5e1e,#1f1f22)',
  cube_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'gerando',
  progress int NOT NULL DEFAULT 0,
  hermes_job_id text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text,
  final_url text,
  thumbnail_url text,
  duration_seconds int NOT NULL DEFAULT 60,
  version int NOT NULL DEFAULT 1,
  downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  start_seconds numeric NOT NULL,
  end_seconds numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.segment_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  body text NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['templates','luts','projects','segments','segment_comments'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "open access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
END LOOP; END $$;

INSERT INTO public.luts (id, name, description, preview_gradient) VALUES
('11111111-0000-0000-0000-000000000001','Teal & Orange','Cinematográfico clássico','linear-gradient(135deg,#0f6b73,#ff8a3d)'),
('11111111-0000-0000-0000-000000000002','Kodak Warm','Tons quentes de filme','linear-gradient(135deg,#7a4b1e,#f4c27a)'),
('11111111-0000-0000-0000-000000000003','Obsidian Mono','Preto e branco contrastado','linear-gradient(135deg,#0e0e11,#c6c6c8)'),
('11111111-0000-0000-0000-000000000004','Natural Clean','Correção neutra + nitidez','linear-gradient(135deg,#8fa98a,#faf6f0)');
INSERT INTO public.templates (name, description, edit_style, lut_id, duration_seconds) VALUES
('Reels Viral','Cortes rápidos, zoom dinâmico, legendas animadas','viral','11111111-0000-0000-0000-000000000001',30),
('Podcast Cortes','Split de câmeras e foco em quem fala','podcast','11111111-0000-0000-0000-000000000002',60),
('Institucional','Ritmo calmo, transições suaves','cinematico','11111111-0000-0000-0000-000000000004',90);