-- usersテーブルにaccount_idを追加
ALTER TABLE users ADD COLUMN account_id TEXT;

-- 既存ユーザーにランダムなaccount_idを付与 (hex(randomblob(4)) + rowid で重複回避)
UPDATE users SET account_id = lower(hex(randomblob(4))) || '-' || id WHERE account_id IS NULL;

-- account_idにユニークインデックスを追加
CREATE UNIQUE INDEX idx_users_account_id ON users(account_id);

-- pairsテーブルにis_soloを追加
ALTER TABLE pairs ADD COLUMN is_solo INTEGER DEFAULT 0;

-- 既存ユーザーに「自分の部屋」を作成
-- 招待コードは 'SOLO-' + account_id とし、重複を避ける
INSERT INTO pairs (user1_id, is_solo, invite_code)
SELECT id, 1, 'SOLO-' || account_id FROM users;
