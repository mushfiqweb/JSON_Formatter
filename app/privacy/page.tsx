import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Cookie, Shield, EyeOff, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | JSONObject Online",
  description: "Read our privacy policy. JSONObject Online uses zero-knowledge encryption and local browser storage to format and share JSON safely without server logs.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-cyan-500/20 selection:text-white antialiased flex flex-col font-sans">
      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-zinc-400 hover:text-cyan-400 text-xs font-mono transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO EDITOR</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              JSONObject.OnLine
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto px-4 py-12 w-full relative z-10">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-in fade-in zoom-in-95 duration-500">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-mono mt-2 uppercase tracking-wide">
            Last Updated: June 28, 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200">
              <Shield size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                1. Core Privacy Philosophy
              </h2>
            </div>
            <p>
              At JSONObject Online, we believe your data belongs solely to you. Our service is designed around a <strong>local-first architecture</strong>. We do not track you, we do not run advertisements, and we do not collect, store, or sell any personal information or JSON payloads.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200">
              <Cookie size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                2. Browser Cookies &amp; Local Storage
              </h2>
            </div>
            <p>
              To provide a fully functioning editor with format, validation, and layout tools, we use essential client-side persistence cookies in the form of <strong>Local Storage (localStorage)</strong> and <strong>Session Storage (sessionStorage)</strong>.
            </p>
            <p>
              These cookie-like stores reside entirely on your device. They store your formatting configurations, custom editor settings, dark mode preferences, and your active input payload. <strong>Without these browser-local cookies, formatting and parsing would be impossible</strong>, as your active code settings would be erased on every page refresh or interaction.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200">
              <Lock size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                3. Zero-Knowledge Share Mechanism
              </h2>
            </div>
            <p>
              When you decide to share your JSON payload with others, we employ a secure client-side encryption process:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>
                <strong>Client-Side Encryption</strong>: Your data is encrypted right inside your browser using the <strong>AES-GCM (256-bit)</strong> cryptosystem.
              </li>
              <li>
                <strong>Decryption Key Fragment</strong>: The key required to decrypt your data is stored in the URL hash fragment (the string of text after the <code>#</code> character).
              </li>
              <li>
                <strong>Zero-Knowledge Server Logs</strong>: According to standard web protocols, hash fragments are never sent to web servers. Therefore, the decryption key is only in the possession of the sender and those they choose to share the URL with. We hold no mechanism to view or decrypt your shared content.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200">
              <EyeOff size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                4. Third-Party Services
              </h2>
            </div>
            <p>
              JSONObject Online does not use any third-party tracking scripts, cookie trackers, or analytics platforms. Our database is used solely to store the encrypted payloads of shared snippets.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200">
              <FileText size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                5. Changes to This Policy
              </h2>
            </div>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by updating the last modified date at the top of this page. You are advised to review this policy periodically for any changes.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] font-mono text-zinc-600 select-none mt-12">
        <p>&copy; {new Date().getFullYear()} JSONObject Online. All rights reserved.</p>
      </footer>
    </div>
  );
}
