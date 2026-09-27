-- 002_legacy_ids.sql：存量资料导入所需的 legacy_id 列
-- 旧 homework.json 的集合/条目 id 保留入库，用于 import-json 幂等与溯源

ALTER TABLE collections ADD COLUMN legacy_id TEXT;
ALTER TABLE resources  ADD COLUMN legacy_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_collections_legacy_id
    ON collections(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_resources_legacy_id
    ON resources(legacy_id) WHERE legacy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_locked   ON resources(locked);
