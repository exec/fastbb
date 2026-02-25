/**
 * Database Schema Definitions
 * Contains all table schemas and indexes for optimal performance
 */

const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  group_id INTEGER DEFAULT 1 REFERENCES user_groups(id),
  joined DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_visit DATETIME,
  is_active INTEGER DEFAULT 1
);

-- User groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT UNIQUE NOT NULL,
  permissions TEXT DEFAULT '[]'
);

-- Forums table
CREATE TABLE IF NOT EXISTS forums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER DEFAULT NULL REFERENCES forums(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forum_id INTEGER NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  views INTEGER DEFAULT 0,
  closed INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  last_post_id INTEGER DEFAULT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited DATETIME,
  is_edited INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  deleted_reason TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'default',
  timezone TEXT DEFAULT 'UTC',
  notifications INTEGER DEFAULT 1
);

-- Forum reads table (for tracking read status)
CREATE TABLE IF NOT EXISTS forum_reads (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forum_id INTEGER NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  read_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, forum_id)
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_forums_parent_id ON forums(parent_id);
CREATE INDEX IF NOT EXISTS idx_forums_sort_order ON forums(sort_order);
CREATE INDEX IF NOT EXISTS idx_forums_is_active ON forums(is_active);

CREATE INDEX IF NOT EXISTS idx_topics_forum_id ON topics(forum_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_last_post_id ON topics(last_post_id);
CREATE INDEX IF NOT EXISTS idx_topics_created ON topics(created);

CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_last_post_id ON posts(last_post_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

CREATE INDEX IF NOT EXISTS idx_forum_reads_user_id ON forum_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_reads_forum_id ON forum_reads(forum_id);

-- Triggers for maintaining denormalized data
CREATE TRIGGER IF NOT EXISTS trg_topics_after_insert
AFTER INSERT ON posts
BEGIN
  UPDATE topics
  SET last_post_id = NEW.id
  WHERE id = NEW.topic_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_topics_update_views
AFTER UPDATE ON topics
FOR EACH ROW
WHEN NEW.views != OLD.views
BEGIN
  -- Trigger to handle view count updates if needed
END;
`;

module.exports = { SCHEMA };
