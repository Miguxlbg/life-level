-- Shop items seed
INSERT OR IGNORE INTO shop_items (id, name, description, type, icon, price_coins, price_level_required, rarity) VALUES
  ('item_border_1', 'Borda Recruta', 'Borda azul sutil para seu avatar', 'border', '🔵', 100, 1, 'common'),
  ('item_border_2', 'Borda Esmeralda', 'Brilho verde neon ao redor do avatar', 'border', '🟢', 300, 3, 'rare'),
  ('item_border_3', 'Aura Violeta', 'Anel roxo pulsante de poder', 'border', '🟣', 800, 8, 'epic'),
  ('item_border_4', 'Coroa Dourada', 'Reservada aos soberanos', 'border', '👑', 2000, 15, 'legendary'),
  ('item_theme_1', 'Tema Dark Neon', 'O visual clássico do sistema', 'theme', '🌑', 0, 1, 'common'),
  ('item_theme_2', 'Cyber Purple', 'Roxo cibernético intenso', 'theme', '🟪', 500, 5, 'rare'),
  ('item_theme_3', 'Emerald Matrix', 'Verde matrix hipnótico', 'theme', '🟩', 700, 7, 'epic'),
  ('item_theme_4', 'Blood Red', 'Vermelho de quem já morreu e renasceu', 'theme', '🟥', 900, 10, 'epic'),
  ('item_title_1', 'O Implacável', 'Título de quem nunca para', 'title', '⚔️', 600, 6, 'rare'),
  ('item_title_2', 'Mestre do Silêncio', 'Para os que agem mais do que falam', 'title', '🤫', 800, 8, 'epic'),
  ('item_title_3', 'Arquiteto do Caos', 'O mais raro dos títulos', 'title', '🌀', 1500, 12, 'legendary'),
  ('item_effect_1', 'Partículas de Energia', 'Faíscas ao redor do avatar', 'effect', '✨', 400, 4, 'rare'),
  ('item_effect_2', 'Chamas da Fênix', 'Efeito de fogo para renascidos', 'effect', '🔥', 1200, 11, 'legendary');
