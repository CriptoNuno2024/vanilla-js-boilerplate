-- Tabela da base de dados D1 (yoshicat-db). Já foi criada à mão na Cloudflare.
-- Este ficheiro serve apenas como documentação; não é executado pelo Worker.
CREATE TABLE IF NOT EXISTS utilizadores (
  chat_id INTEGER PRIMARY KEY,
  avisos_ligados INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  -- Data (Lisboa, AAAA-MM-DD) do último aviso diário enviado; NULL = ainda nenhum.
  ultimo_aviso_dia TEXT
);

-- A tabela já existe na Cloudflare, por isso a coluna nova tem de ser acrescentada à mão,
-- UMA vez, na consola da D1 (antes de publicar o Worker novo):
--   ALTER TABLE utilizadores ADD COLUMN ultimo_aviso_dia TEXT;
