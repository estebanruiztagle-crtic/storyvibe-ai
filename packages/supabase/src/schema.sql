-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- presentations
-- ============================================================
CREATE TABLE IF NOT EXISTS presentations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own presentations"
  ON presentations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- zone1_contexts
-- ============================================================
CREATE TABLE IF NOT EXISTS zone1_contexts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'propagated')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone1_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone1_contexts"
  ON zone1_contexts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone1_contexts.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone1_contexts.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- zone2a_data
-- ============================================================
CREATE TABLE IF NOT EXISTS zone2a_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone2a_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone2a_data"
  ON zone2a_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone2a_data.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone2a_data.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- zone2b_data
-- ============================================================
CREATE TABLE IF NOT EXISTS zone2b_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'framework_selected', 'validated')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone2b_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone2b_data"
  ON zone2b_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone2b_data.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone2b_data.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- emotional_curves
-- ============================================================
CREATE TABLE IF NOT EXISTS emotional_curves (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  version          INTEGER NOT NULL DEFAULT 1,
  data             JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'locked')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE emotional_curves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own emotional_curves"
  ON emotional_curves
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = emotional_curves.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = emotional_curves.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- zone3_data
-- ============================================================
CREATE TABLE IF NOT EXISTS zone3_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone3_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone3_data"
  ON zone3_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone3_data.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone3_data.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- zone4_data
-- ============================================================
CREATE TABLE IF NOT EXISTS zone4_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone4_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone4_data"
  ON zone4_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone4_data.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone4_data.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- zone5_data
-- ============================================================
CREATE TABLE IF NOT EXISTS zone5_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zone5_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own zone5_data"
  ON zone5_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone5_data.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = zone5_data.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- brand_layers
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_layers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brand_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own brand_layers"
  ON brand_layers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = brand_layers.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = brand_layers.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- assets
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id  UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('image', 'video', 'chart', 'illustration')),
  source           TEXT NOT NULL CHECK (source IN ('drive', 'generated', 'pinterest_reference')),
  url              TEXT NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own assets"
  ON assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = assets.presentation_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations p
      WHERE p.id = assets.presentation_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_presentations
  BEFORE UPDATE ON presentations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone1_contexts
  BEFORE UPDATE ON zone1_contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone2a_data
  BEFORE UPDATE ON zone2a_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone2b_data
  BEFORE UPDATE ON zone2b_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_emotional_curves
  BEFORE UPDATE ON emotional_curves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone3_data
  BEFORE UPDATE ON zone3_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone4_data
  BEFORE UPDATE ON zone4_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_zone5_data
  BEFORE UPDATE ON zone5_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_brand_layers
  BEFORE UPDATE ON brand_layers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_zone1_contexts_presentation_id ON zone1_contexts(presentation_id);
CREATE INDEX IF NOT EXISTS idx_zone2a_data_presentation_id ON zone2a_data(presentation_id);
CREATE INDEX IF NOT EXISTS idx_zone2b_data_presentation_id ON zone2b_data(presentation_id);
CREATE INDEX IF NOT EXISTS idx_emotional_curves_presentation_id ON emotional_curves(presentation_id);
CREATE INDEX IF NOT EXISTS idx_zone3_data_presentation_id ON zone3_data(presentation_id);
CREATE INDEX IF NOT EXISTS idx_zone4_data_presentation_id ON zone4_data(presentation_id);
CREATE INDEX IF NOT EXISTS idx_zone5_data_presentation_id ON zone5_data(presentation_id);
CREATE INDEX IF NOT EXISTS idx_brand_layers_presentation_id ON brand_layers(presentation_id);
CREATE INDEX IF NOT EXISTS idx_assets_presentation_id ON assets(presentation_id);
