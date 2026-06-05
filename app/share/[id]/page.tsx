"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useJSONStore } from "@/store/store";
import { decryptJSON } from "@/utils/jsonUtils";
import { supabaseClient } from "@/utils/supabaseClient";
import HomePage from "@/app/page";
import { KeyRound, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const setRawInput = useJSONStore((state) => state.setRawInput);
  
  const [status, setStatus] = useState<"loading" | "decrypted" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAndDecrypt() {
      try {
        // 1. Extract decryption key from URL hash fragment
        const hash = window.location.hash;
        if (!hash) {
          throw new Error(
            "Decryption key is missing from the URL. Because this platform is Zero-Knowledge, it is impossible to recover this content without the key fragment."
          );
        }

        // Handle both formats: #key=xyz or #xyz
        let keyStr = "";
        if (hash.startsWith("#key=")) {
          keyStr = hash.substring(5);
        } else {
          keyStr = hash.substring(1);
        }

        if (!keyStr) {
          throw new Error("Invalid decryption key structure in URL hash.");
        }

        // 2. Fetch encrypted payload from Supabase
        const { data, error } = await supabaseClient
          .from("json_formatter_snippets")
          .select("encrypted_content, iv")
          .eq("id", id)
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Snippet not found in database.");
        }

        const { encrypted_content, iv } = data;

        // 3. Perform decryption locally in the browser
        const decryptedPayload = await decryptJSON(encrypted_content, iv, keyStr);

        // 4. Load the decrypted content into the workspace state store
        setRawInput(decryptedPayload);
        setStatus("decrypted");
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "Failed to load and decrypt snippet.");
        setStatus("error");
      }
    }

    loadAndDecrypt();
  }, [id, setRawInput]);

  // If successfully decrypted, render the standard workspace loaded with this payload!
  if (status === "decrypted") {
    return <HomePage />;
  }

  // Error State: Display a sleek error recovery panel
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 select-none">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
          <div className="h-14 w-14 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mb-6">
            <ShieldAlert className="h-6 w-6 text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-zinc-100 mb-2">Decryption Failed</h2>
          <p className="text-xs text-zinc-400 font-mono mb-6 bg-zinc-950 p-4 border border-zinc-850 rounded-lg text-left break-words w-full max-w-full">
            {errorMessage}
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold hover:text-white transition-all cursor-pointer"
          >
            Go to Main Workspace
          </button>
        </div>
      </div>
    );
  }

  // Loading State: Show a beautiful loading card
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 select-none">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 flex flex-col items-center text-center shadow-xl">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10 animate-pulse">
          <KeyRound className="h-5 w-5 text-white" />
        </div>

        <h3 className="text-sm font-semibold tracking-wide text-zinc-300 mb-1">
          RETRIEVING ENCRYPTED SNIPPET
        </h3>
        <p className="text-[10px] font-mono tracking-widest text-zinc-500 mb-6">
          ZERO-KNOWLEDGE DECRYPTION IN PROGRESS
        </p>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          <span>Decrypting locally...</span>
        </div>
        <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed font-sans">
          Connecting to database and executing browser Web Crypto APIs. Your private key fragment is kept client-side.
        </p>
      </div>
    </div>
  );
}
