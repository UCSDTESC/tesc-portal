import supabase from "@server/supabase";

const CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ value, expiresAt: Date.now() + ttlMs }));
  } catch {
    // ignore quota errors
  }
}

export const fetchOrgs = async () => {
  const cached = readCache<string[]>("tesc_orgs");
  if (cached) return { events: cached, error: null };

  const { data, error } = await supabase.from("orgs").select("name");
  if (data) {
    const events = data
      .map((item) => item.name)
      .filter((name) => String(name).toLowerCase() !== "super_org");
    writeCache("tesc_orgs", events);
    return { events, error };
  }
  return { events: null, error };
};

export const fetchGradYears = async () => {
  const cached = readCache<string[]>("tesc_grad_years");
  if (cached) return { gradYears: cached, error: null };

  const { data, error } = await supabase
    .from("users")
    .select("expected_grad")
    .not("expected_grad", "is", null);

  if (data) {
    const unique = [...new Set(data.map((item) => String(item.expected_grad)).filter(Boolean))].sort();
    writeCache("tesc_grad_years", unique);
    return { gradYears: unique, error };
  }
  return { gradYears: null, error };
};
