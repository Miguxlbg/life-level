-- ===================================================
-- LIFE LEVEL — SCHEMA COMPLETO PARA TURSO / libSQL
-- Schema único consolidado (FASE 1+2+3+4). Use este arquivo
-- para inicializar o banco no Turso de uma só vez:
--   turso db shell <DB_NAME> < schema-turso.sql
-- ===================================================

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE,
  nick TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  avatar_emoji TEXT,
  password_hash TEXT,
  birth_date TEXT,
  age INTEGER,
  life_phase TEXT,
  biological_sex TEXT,
  height_cm INTEGER,
  weight_kg REAL,
  bmi REAL,
  bmi_class TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next INTEGER DEFAULT 100,
  coins INTEGER DEFAULT 0,
  title TEXT DEFAULT 'Iniciado',
  class TEXT DEFAULT 'Recruta',
  streak_days INTEGER DEFAULT 0,
  last_streak_date TEXT,
  last_login_at TEXT DEFAULT (datetime('now')),
  death_count INTEGER DEFAULT 0,
  is_dead INTEGER DEFAULT 0,
  is_online INTEGER DEFAULT 0,
  focus_area TEXT,
  primary_goal TEXT,
  procedural_profile TEXT DEFAULT '{}',
  missions_completed_total INTEGER DEFAULT 0,
  onboarding_completed INTEGER DEFAULT 0,
  assessment_completed INTEGER DEFAULT 0,
  guild_id TEXT,
  location_lat REAL,
  location_lng REAL,
  max_level_reached INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_attributes (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  max_value INTEGER DEFAULT 100,
  level INTEGER DEFAULT 1,
  delta_week INTEGER DEFAULT 0,
  sub_attributes TEXT DEFAULT '{}',
  base_value INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT (datetime('now')),
  UNIQUE(player_id, attribute_key)
);

CREATE TABLE IF NOT EXISTS player_skills (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  skill_level INTEGER DEFAULT 0,
  xp_in_skill INTEGER DEFAULT 0,
  sub_skills TEXT DEFAULT '{}',
  unlocked_at TEXT,
  last_practiced TEXT,
  UNIQUE(player_id, skill_category)
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  type TEXT,
  difficulty TEXT,
  xp_reward INTEGER,
  coins_reward INTEGER,
  attribute_gains TEXT DEFAULT '{}',
  skill_gains TEXT DEFAULT '{}',
  status TEXT DEFAULT 'active',
  frequency TEXT,
  due_date TEXT,
  completed_at TEXT,
  is_procedural INTEGER DEFAULT 1,
  generated_by TEXT DEFAULT 'system',
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  activity_type TEXT,
  description TEXT,
  duration_minutes INTEGER,
  intensity TEXT,
  xp_earned INTEGER,
  coins_earned INTEGER,
  attribute_impacts TEXT DEFAULT '{}',
  skill_impacts TEXT DEFAULT '{}',
  logged_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_daily_snapshots (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  overall_score REAL,
  corpo_value INTEGER,
  mente_value INTEGER,
  emocional_value INTEGER,
  social_value INTEGER,
  proposito_value INTEGER,
  financas_value INTEGER,
  energia_value INTEGER,
  disciplina_value INTEGER,
  foco_value INTEGER,
  consistencia_value INTEGER,
  xp_total INTEGER,
  level_at_date INTEGER,
  missions_completed_today INTEGER DEFAULT 0,
  streak_at_date INTEGER,
  notable_event TEXT,
  notable_event_label TEXT,
  UNIQUE(player_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  emblem TEXT,
  emblem_color TEXT,
  owner_id TEXT,
  total_xp INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  rank_position INTEGER,
  is_public INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  contributed_xp INTEGER DEFAULT 0,
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (guild_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_player ON guild_members(player_id);

CREATE TABLE IF NOT EXISTS player_achievements (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(player_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_player_achievements ON player_achievements(player_id);

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  type TEXT,
  icon TEXT,
  price_coins INTEGER,
  price_level_required INTEGER DEFAULT 1,
  rarity TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  item_id TEXT,
  equipped INTEGER DEFAULT 0,
  acquired_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessment_responses (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  satisfaction_score INTEGER,
  critical_attribute TEXT,
  strongest_attribute TEXT,
  dopamine_drains TEXT,
  sleep_quality INTEGER,
  discipline_level TEXT,
  trains_body INTEGER,
  studies_consistently INTEGER,
  finances_organized INTEGER,
  social_life_healthy INTEGER,
  primary_goal_area TEXT,
  raw_answers TEXT DEFAULT '{}',
  analyzed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS death_log (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  cause TEXT,
  died_at TEXT DEFAULT (datetime('now')),
  stats_at_death TEXT DEFAULT '{}',
  days_offline INTEGER,
  level_at_death INTEGER,
  reset_completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_follows (
  follower_id TEXT,
  following_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  type TEXT,
  title TEXT,
  message TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  event_date TEXT NOT NULL,
  event_time TEXT,
  category TEXT DEFAULT 'nota',
  color TEXT DEFAULT '#7c3aed',
  reminder INTEGER DEFAULT 0,
  done INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_player_date ON calendar_events(player_id, event_date);

CREATE INDEX IF NOT EXISTS idx_player_attributes_player ON player_attributes(player_id);
CREATE INDEX IF NOT EXISTS idx_missions_player_status ON missions(player_id, status);
CREATE INDEX IF NOT EXISTS idx_snapshots_player_date ON player_daily_snapshots(player_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_player ON activities(player_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_xp ON players(xp DESC);
CREATE INDEX IF NOT EXISTS idx_players_level ON players(level DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_player_unread ON notifications(player_id, read);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
