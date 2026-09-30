-- 003_year.sql：资料学年（YYYY-YYYY，如 2026-2027）
-- 方案见 doc/ai/sessions/20260930/enilu.md：resources 增列并从 rel_path 回填存量

ALTER TABLE resources ADD COLUMN year TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_resources_year ON resources(year);

-- 回填存量：files/library/YYYY-YYYY/... 取第二段；
-- 无法解析的（files/library/2026/ 旧路径、站点外 uploads 等）保持空串=未设置
UPDATE resources
   SET year = substr(rel_path, 15, 9)
 WHERE rel_path LIKE 'files/library/____-____/%'
   AND substr(rel_path, 15, 4) GLOB '[0-9][0-9][0-9][0-9]'
   AND substr(rel_path, 19, 1) = '-'
   AND substr(rel_path, 20, 4) GLOB '[0-9][0-9][0-9][0-9]';
