import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isMock = !supabaseUrl || !supabaseAnonKey;

export const isSupabaseMocked = isMock;

// Unified database interface for real Supabase SDK or LocalStorage Mock
const realClient = !isMock ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const supabaseClient = {
  isMock: isMock,
  rpc: async (fn: string, args: any) => {
    if (!isMock && realClient) {
      return realClient.rpc(fn, args);
    }
    
    // Mock RPC implementation
    if (fn === "track_snippet_view") {
      try {
        const res = await fetch("/api/mock-share", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "track_view", 
            id: args.snippet_id,
            is_unique: args.is_unique 
          })
        });
        return { error: res.ok ? null : new Error("mock rpc failed") };
      } catch(err) { return { error: err }; }
    }
    return { error: null };
  },
  from: (table: string) => {
    if (!isMock && realClient) {
      return realClient.from(table);
    }

    // Mock Implementation matching Supabase SDK chaining structure
    return {
      delete: () => {
        return {
          eq: (columnName: string, value: any) => {
            return {
              eq: async (secondCol: string, secondVal: any) => {
                if (columnName === "id" && secondCol === "creator_token") {
                  if (typeof window !== "undefined") {
                    try {
                      const res = await fetch("/api/mock-share", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: value, token: secondVal }),
                      });
                      if (res.ok) {
                        localStorage.removeItem(`snippet_${value}`);
                        return { data: null, error: null };
                      } else {
                        const body = await res.json();
                        return { data: null, error: { message: body.error } };
                      }
                    } catch (err: any) {
                      return { data: null, error: err };
                    }
                  }
                }
                return { data: null, error: { message: "Mock delete failed" } };
              }
            };
          }
        };
      },
      insert: (rows: any[]) => {
        const row = rows[0];
        const id = typeof window !== "undefined" ? window.crypto.randomUUID() : "mock-uuid";
        const creator_token = typeof window !== "undefined" ? window.crypto.randomUUID() : "mock-token";
        
        const newRecord = {
          id,
          creator_token,
          encrypted_content: row.encrypted_content,
          iv: row.iv,
          language: row.language || "json",
          created_at: new Date().toISOString(),
          views_count: 0,
          last_viewed_at: null,
        };

        if (typeof window !== "undefined") {
          console.log(`[Mock DB] Inserting snippet: saving key "snippet_${id}" to localStorage`, newRecord);
          try {
            localStorage.setItem(`snippet_${id}`, JSON.stringify(newRecord));
          } catch (err) {
            console.warn(`[Mock DB] Failed to save snippet to localStorage (QuotaExceeded?).`, err);
          }

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
          in: async (columnName: string, values: any[]) => {
            if (columnName === "id" && typeof window !== "undefined") {
              let fetchedData: any[] = [];
              try {
                const res = await fetch(`/api/mock-share?ids=${values.join(",")}`);
                if (res.ok) {
                  const body = await res.json();
                  fetchedData = body.data || [];
                }
              } catch (err) {
                console.warn("[Mock DB] Batch fetch failed, falling back to localStorage");
              }
              
              // Fallback for missing records using localStorage
              const finalData = values.map((id) => {
                const serverRecord = fetchedData.find((r: any) => r.id === id);
                if (serverRecord) return serverRecord;
                
                const localStr = localStorage.getItem(`snippet_${id}`);
                if (localStr) {
                  return JSON.parse(localStr);
                }
                return null;
              }).filter(Boolean);

              return { data: finalData, error: null };
            }
            return { data: [], error: null };
          },
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
