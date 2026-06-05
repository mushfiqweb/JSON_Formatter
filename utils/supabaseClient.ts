import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isMock = !supabaseUrl || !supabaseAnonKey;

export const isSupabaseMocked = isMock;

// Unified database interface for real Supabase SDK or LocalStorage Mock
export const supabaseClient = {
  isMock: isMock,
  from: (table: string) => {
    if (!isMock) {
      // Connect to real Supabase
      const client = createClient(supabaseUrl, supabaseAnonKey);
      return client.from(table);
    }

    // Mock Implementation matching Supabase SDK chaining structure
    return {
      insert: (rows: any[]) => {
        const row = rows[0];
        const id = typeof window !== "undefined" ? window.crypto.randomUUID() : "mock-uuid";
        const newRecord = {
          id,
          encrypted_content: row.encrypted_content,
          iv: row.iv,
          language: row.language || "json",
          created_at: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
          console.log(`[Mock DB] Inserting snippet: saving key "snippet_${id}" to localStorage`, newRecord);
          localStorage.setItem(`snippet_${id}`, JSON.stringify(newRecord));

          // Also attempt to persist on server via API route asynchronously
          fetch("/api/mock-share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, record: newRecord }),
          }).catch((err) => {
            console.error("[Mock DB] Server-side storage failed, fallback to localStorage only:", err);
          });
        }

        const result = { data: [newRecord], error: null };

        // Support both direct await of insert() and chaining with .select()
        const promise = Promise.resolve(result);
        const chainable = Object.create(promise);
        chainable.select = () => Promise.resolve(result);
        return chainable;
      },

      select: (selectQuery?: string) => {
        return {
          eq: (columnName: string, value: any) => {
            return {
              single: async () => {
                if (typeof window !== "undefined") {
                  console.log(`[Mock DB] Selecting snippet: fetching key "snippet_${value}"`);

                  // 1. Try to fetch from server-side mock DB API first
                  try {
                    const res = await fetch(`/api/mock-share?id=${value}`);
                    if (res.ok) {
                      const body = await res.json();
                      if (body.data) {
                        console.log(`[Mock DB] Snippet found on server:`, body.data);
                        return { data: body.data, error: null };
                      }
                    }
                  } catch (err) {
                    console.warn("[Mock DB] Server-side fetch failed, trying localStorage:", err);
                  }

                  // 2. Fall back to localStorage
                  const recordStr = localStorage.getItem(`snippet_${value}`);
                  if (recordStr) {
                    const record = JSON.parse(recordStr);
                    console.log(`[Mock DB] Snippet found in localStorage:`, record);
                    return { data: record, error: null };
                  }
                  console.warn(`[Mock DB] Snippet key "snippet_${value}" was not found anywhere.`);
                }

                return {
                  data: null,
                  error: { message: `Record with id ${value} not found (Mock Database)` },
                };
              },
            };
          },
        };
      },
    };
  },
};
