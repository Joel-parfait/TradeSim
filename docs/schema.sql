-- Extension pour générer des UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_by INTEGER REFERENCES users(id),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Portefeuilles (Wallets)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(20, 8) DEFAULT 0.0,
    bonus_balance DECIMAL(20, 8) DEFAULT 0.0,
    total_profit DECIMAL(20, 8) DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Simulations de Trading
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crypto_symbol VARCHAR(20) NOT NULL,
    amount_invested DECIMAL(20, 8) NOT NULL,
    target_profit DECIMAL(20, 8) NOT NULL,
    duration_hours INTEGER DEFAULT 24,
    start_price DECIMAL(20, 8),
    end_price_target DECIMAL(20, 8),
    current_simulated_price DECIMAL(20, 8),
    status VARCHAR(20) CHECK (status IN ('running', 'completed', 'cancelled')) DEFAULT 'running',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP
);

-- Table des Transactions (Historique)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'deposit', 'withdrawal', 'referral_bonus', 'trade_profit'
    amount DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);