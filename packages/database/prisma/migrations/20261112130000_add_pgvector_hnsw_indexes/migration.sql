-- Ensure pgvector HNSW cosine-similarity indexes exist for fast semantic retrieval
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx"
  ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "chunk_embeddings_embedding_hnsw_idx"
  ON "chunk_embeddings" USING hnsw ("embedding" vector_cosine_ops);

