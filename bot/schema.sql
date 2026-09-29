-- Tabela da base de dados D1 (yoshicat-db). Já foi criada à mão na Cloudflare.
-- Este ficheiro serve apenas como documentação; não é executado pelo Worker.
CREATE TABLE IF NOT EXISTS utilizadores (
  chat_id INTEGER PRIMARY KEY,
  avisos_ligados INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
