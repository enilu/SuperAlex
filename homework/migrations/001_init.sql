-- 001_init.sql：学习工作台基础结构
-- 依据 doc/superpowers/plans/20260927-homework-workbench.md 第 5 节

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    subject      TEXT NOT NULL,
    kind         TEXT NOT NULL CHECK (kind IN ('in_school', 'extra_school')),
    due_date     TEXT NOT NULL,                 -- YYYY-MM-DD
    est_minutes  INTEGER NOT NULL DEFAULT 20,
    note         TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'done', 'cancelled')),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    created_by   INTEGER REFERENCES users(id),
    completed_at TEXT,
    completed_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_due      ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_tasks_subject  ON tasks(subject, due_date);

-- 资料库元数据：文件本体仍在文件系统
--   visibility=public  → 站点内 files/...，由 nginx 静态直出
--   visibility=private → 站点外 uploads 目录，只能走鉴权接口
--   locked=1           → 存量资料，元数据可改、文件不可删、rel_path 锁定
CREATE TABLE IF NOT EXISTS collections (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    year     INTEGER,
    grade    TEXT NOT NULL DEFAULT '',
    semester TEXT NOT NULL DEFAULT '',
    summary  TEXT NOT NULL DEFAULT '',
    cover    TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resources (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER REFERENCES collections(id),
    kind         TEXT NOT NULL DEFAULT 'library'
                 CHECK (kind IN ('library', 'homework')),
    title        TEXT NOT NULL,
    subject      TEXT NOT NULL DEFAULT '',
    category     TEXT NOT NULL DEFAULT '',
    tags         TEXT NOT NULL DEFAULT '',
    note         TEXT NOT NULL DEFAULT '',
    rel_path     TEXT NOT NULL,
    size         INTEGER NOT NULL DEFAULT 0,
    mime         TEXT NOT NULL DEFAULT '',
    sha256       TEXT UNIQUE,
    visibility   TEXT NOT NULL DEFAULT 'private'
                 CHECK (visibility IN ('public', 'private')),
    locked       INTEGER NOT NULL DEFAULT 0,
    created_by   INTEGER REFERENCES users(id),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility, kind);
CREATE INDEX IF NOT EXISTS idx_resources_subject    ON resources(subject);

-- 任务 ⇄ 资料 多对多
CREATE TABLE IF NOT EXISTS task_resources (
    task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    PRIMARY KEY (task_id, resource_id)
);

-- 打卡流水，供完成分析
CREATE TABLE IF NOT EXISTS checkins (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action  TEXT NOT NULL CHECK (action IN ('done', 'reopen', 'delete')),
    actor   TEXT NOT NULL DEFAULT '',
    ts      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkins_task ON checkins(task_id, ts);
