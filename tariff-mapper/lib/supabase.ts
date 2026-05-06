import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { MappingResponse, SearchHistoryEntry } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: AnySupabase | null = null;

function getClient(): AnySupabase | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// Cache key: hash of query + direction for deduplication
function cacheKey(query: string, direction: string): string {
  return `${direction}::${query.trim().toLowerCase()}`;
}

export async function getCachedMapping(
  query: string,
  direction: string
): Promise<MappingResponse | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const key = cacheKey(query, direction);
    const { data, error } = await client
      .from("mappings_cache")
      .select("result")
      .eq("cache_key", key)
      .single();

    if (error || !data) return null;
    return { ...(data.result as MappingResponse), cached: true };
  } catch {
    return null;
  }
}

export async function setCachedMapping(
  query: string,
  direction: string,
  result: MappingResponse
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const key = cacheKey(query, direction);
    await client.from("mappings_cache").upsert({
      cache_key: key,
      result,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Cache writes are non-critical
  }
}

export async function logSearchHistory(
  entry: SearchHistoryEntry
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.from("search_history").insert({
      query: entry.query,
      direction: entry.direction,
      search_mode: entry.search_mode,
      hs_anchor: entry.hs_anchor,
      result_count: entry.result_count,
      created_at: new Date().toISOString(),
    });
  } catch {
    // History logging is non-critical
  }
}
