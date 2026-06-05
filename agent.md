**Task Name:** Build Secure Zero-Knowledge JSON Utility Platform

**Goal:**
Develop a modern, client-side, distraction-free JSON utility web application that replaces legacy formatting tools. The app must execute all parsing, formatting, transformations, and cryptographic operations exclusively in the user's browser without server-side processing.

**Tech Stack & Integrations:**

* **Framework:** Next.js (App Router)
* **Hosting:** Vercel
* **Database:** Supabase (PostgreSQL)
* **Styling:** Tailwind CSS (Dark-mode optimized 'Zen Mode' UI)
* **State Management:** Zustand
* **Core Libraries:** `@monaco-editor/react`, `react-json-view-lite`, `fast-xml-parser`, `json-2-csv`, `jsonrepair`, `lucide-react`.

**Implementation Plan & Strict Constraints:**

1. **Scaffolding & UI:** Initialize the Next.js app. Create a responsive dual-pane layout using CSS Grid (`grid-cols-2` on desktop). The left pane is the raw input staging area, and the right pane is the interactive output/viewer. Use a high-contrast dark theme (e.g., Tailwind's `slate-900`).
2. **Editor Integration:** Implement the Monaco Editor (`@monaco-editor/react`). **Crucial constraint:** You must import this component using Next.js `next/dynamic` with `{ ssr: false }` to prevent server-side rendering reference errors. Hook it to the Zustand store with debounce logic on input.
3. **Processing Pipeline:** Create a robust utility module for data handling. The default action should attempt `JSON.parse()`. If a `SyntaxError` occurs, automatically pass the string through the `jsonrepair` library to fix LLM-generated artifacts, trailing commas, or missing brackets before formatting.
4. **Transformation Features:** Implement handlers to convert the validated JSON into XML (using `fast-xml-parser` configured for formatting), CSV (using `json-2-csv`), and an interactive visual tree (using `react-json-view-lite`).
5. **Zero-Knowledge Sharing Mechanism:**
* Implement client-side encryption using the native Web Crypto API (`window.crypto.subtle`).
* Generate an extractable 256-bit AES-GCM key and a 12-byte IV.
* Encrypt the formatted JSON payload locally.
* Transmit *only* the Base64-encoded ciphertext and IV to Supabase.
* Generate a sharing URL by appending the raw Base64 encryption key as a URL fragment identifier (e.g., `domain.com/share/[uuid]#[key]`).


6. **Supabase Backend & Security:**
* Create a `snippets` table with columns: `id` (UUID), `encrypted_content`, `iv`, `language`, `created_at`, and `expires_at`.
* Write and execute the SQL to enable Row Level Security (RLS), allowing anonymous inserts but restricting generic read access.
* Write a `pg_cron` SQL function and schedule to automatically purge rows where `expires_at` is in the past.


7. **Decryption Route:** Build the dynamic inbound route `app/share/[id]/page.tsx`. It must fetch the ciphertext from Supabase based on the UUID, extract the decryption key strictly from `window.location.hash`, and decrypt the data locally before injecting it into the Monaco editor state.

**Execution:**
Please summarize these requirements, propose your Task Plan, and begin executing the file creation, coding, and configuration step-by-step.

---