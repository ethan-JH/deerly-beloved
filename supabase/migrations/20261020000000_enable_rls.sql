-- Enable RLS on every public table with no permissive policies (default-deny).
-- This app never reads/writes Supabase directly from the browser — every access
-- goes through Next.js API routes using the service-role key, which always
-- bypasses RLS regardless of policies. This purely closes off the public
-- PostgREST API that the anon key would otherwise have full access to.
alter table invites enable row level security;
alter table guests enable row level security;
alter table breakout_scores enable row level security;
alter table app_config enable row level security;
