-- Run this in Supabase SQL Editor
-- Adds public read access to all Regime tables
-- (safe for a read-only public dashboard)

ALTER TABLE market_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE factors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE regime       ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation   ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON market_data  FOR SELECT USING (true);
CREATE POLICY "public read" ON factors      FOR SELECT USING (true);
CREATE POLICY "public read" ON regime       FOR SELECT USING (true);
CREATE POLICY "public read" ON allocation   FOR SELECT USING (true);
CREATE POLICY "public read" ON performance  FOR SELECT USING (true);
