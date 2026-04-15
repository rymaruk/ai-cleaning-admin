-- RPC: vector search within a specific project's products
-- Uses cosine similarity via pgvector <=> operator

CREATE OR REPLACE FUNCTION match_project_products(
  query_embedding vector(3072),
  p_project_id uuid,
  match_count int DEFAULT 10,
  min_similarity float DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  external_id text,
  name text,
  brand text,
  category text,
  price numeric,
  currency text,
  images text[],
  url text,
  extra_data jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pp.id,
    pp.external_id,
    pp.name,
    pp.brand,
    pp.category,
    pp.price,
    pp.currency,
    pp.images,
    pp.url,
    pp.extra_data,
    (1.0 - (pp.embedding <=> query_embedding))::float AS similarity
  FROM project_products pp
  WHERE pp.project_id = p_project_id
    AND pp.embedding IS NOT NULL
    AND (1.0 - (pp.embedding <=> query_embedding)) >= min_similarity
  ORDER BY pp.embedding <=> query_embedding
  LIMIT match_count;
$$;
