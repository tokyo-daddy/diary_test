-- public_diariesテーブルにis_draftを追加
ALTER TABLE public_diaries ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0;

-- インデックスの追加（パフォーマンスとフィルター用）
CREATE INDEX idx_public_diaries_author_draft ON public_diaries(author_id, is_draft, created_at);
