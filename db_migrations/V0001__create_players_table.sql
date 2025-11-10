CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) DEFAULT 'Аноним',
    total_clicks BIGINT DEFAULT 0,
    click_power INTEGER DEFAULT 1,
    auto_click_rate DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_total_clicks ON players(total_clicks DESC);
CREATE INDEX idx_players_player_id ON players(player_id);