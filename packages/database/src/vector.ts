import { PrismaClient } from '@prisma/client';

export interface VectorSearchParams {
  embedding: number[];
  limit?: number;
  minSimilarity?: number;
  documentIds?: string[];
  courseId?: string;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  chapter: string | null;
  sectionTitle: string | null;
  similarity: number;
}

/**
 * Validates and formats a number array into a pgvector string representation: '[0.1,0.2,...]'.
 */
export function formatVectorLiteral(embedding: number[]): string {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Vector embedding must be a non-empty array of numbers');
  }
  return `[${embedding.join(',')}]`;
}

/**
 * Stores a vector embedding for a given document chunk in both document_chunks and chunk_embeddings.
 */
export async function storeChunkVector(
  client: PrismaClient,
  chunkId: string,
  embedding: number[],
  model = 'text-embedding-004',
): Promise<void> {
  const vectorStr = formatVectorLiteral(embedding);
  const dimension = embedding.length;

  // Update the embedding column in document_chunks
  await client.$executeRaw`
    UPDATE "document_chunks"
    SET "embedding" = ${vectorStr}::vector
    WHERE "id" = ${chunkId}
  `;

  // Upsert the embedding record in chunk_embeddings
  await client.$executeRaw`
    INSERT INTO "chunk_embeddings" ("id", "chunkId", "model", "dimension", "embedding", "createdAt")
    VALUES (gen_random_uuid(), ${chunkId}, ${model}, ${dimension}, ${vectorStr}::vector, NOW())
    ON CONFLICT ("chunkId", "model")
    DO UPDATE SET
      "dimension" = EXCLUDED."dimension",
      "embedding" = EXCLUDED."embedding",
      "createdAt" = NOW()
  `;
}

/**
 * Performs a cosine similarity vector search across document chunks.
 */
export async function searchSimilarChunks(
  client: PrismaClient,
  params: VectorSearchParams,
): Promise<VectorSearchResult[]> {
  const {
    embedding,
    limit = 5,
    minSimilarity = 0.0,
    documentIds,
    courseId,
  } = params;

  const vectorStr = formatVectorLiteral(embedding);

  if (courseId) {
    // Search chunks belonging to documents associated with the specified course
    const results = await client.$queryRaw<
      Array<{
        chunkId: string;
        documentId: string;
        chunkIndex: number;
        content: string;
        pageNumber: number | null;
        chapter: string | null;
        sectionTitle: string | null;
        similarity: number;
      }>
    >`
      SELECT 
        dc."id" AS "chunkId",
        dc."documentId" AS "documentId",
        dc."chunkIndex" AS "chunkIndex",
        dc."content" AS "content",
        dc."pageNumber" AS "pageNumber",
        dc."chapter" AS "chapter",
        dc."sectionTitle" AS "sectionTitle",
        (1 - (dc."embedding" <=> ${vectorStr}::vector)) AS "similarity"
      FROM "document_chunks" dc
      INNER JOIN "course_documents" cd ON cd."documentId" = dc."documentId"
      WHERE cd."courseId" = ${courseId}
        AND dc."embedding" IS NOT NULL
        AND (1 - (dc."embedding" <=> ${vectorStr}::vector)) >= ${minSimilarity}
      ORDER BY dc."embedding" <=> ${vectorStr}::vector ASC
      LIMIT ${limit}
    `;

    return results;
  }

  if (documentIds && documentIds.length > 0) {
    // Search chunks constrained to specific document IDs
    const results = await client.$queryRaw<
      Array<{
        chunkId: string;
        documentId: string;
        chunkIndex: number;
        content: string;
        pageNumber: number | null;
        chapter: string | null;
        sectionTitle: string | null;
        similarity: number;
      }>
    >`
      SELECT 
        dc."id" AS "chunkId",
        dc."documentId" AS "documentId",
        dc."chunkIndex" AS "chunkIndex",
        dc."content" AS "content",
        dc."pageNumber" AS "pageNumber",
        dc."chapter" AS "chapter",
        dc."sectionTitle" AS "sectionTitle",
        (1 - (dc."embedding" <=> ${vectorStr}::vector)) AS "similarity"
      FROM "document_chunks" dc
      WHERE dc."documentId" = ANY(${documentIds}::text[])
        AND dc."embedding" IS NOT NULL
        AND (1 - (dc."embedding" <=> ${vectorStr}::vector)) >= ${minSimilarity}
      ORDER BY dc."embedding" <=> ${vectorStr}::vector ASC
      LIMIT ${limit}
    `;

    return results;
  }

  // Global search across all indexed chunks
  const results = await client.$queryRaw<
    Array<{
      chunkId: string;
      documentId: string;
      chunkIndex: number;
      content: string;
      pageNumber: number | null;
      chapter: string | null;
      sectionTitle: string | null;
      similarity: number;
    }>
  >`
    SELECT 
      dc."id" AS "chunkId",
      dc."documentId" AS "documentId",
      dc."chunkIndex" AS "chunkIndex",
      dc."content" AS "content",
      dc."pageNumber" AS "pageNumber",
      dc."chapter" AS "chapter",
      dc."sectionTitle" AS "sectionTitle",
      (1 - (dc."embedding" <=> ${vectorStr}::vector)) AS "similarity"
    FROM "document_chunks" dc
    WHERE dc."embedding" IS NOT NULL
      AND (1 - (dc."embedding" <=> ${vectorStr}::vector)) >= ${minSimilarity}
    ORDER BY dc."embedding" <=> ${vectorStr}::vector ASC
    LIMIT ${limit}
  `;

  return results;
}
