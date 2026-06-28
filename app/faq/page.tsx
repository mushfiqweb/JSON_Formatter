import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, Lock, Cookie, ShieldCheck, Database, Braces } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions | JSONObject Online",
  description: "Learn how JSONObject Online formats, validates, and shares JSON payloads securely and privately using client-side zero-knowledge encryption.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-cyan-500/20 selection:text-white antialiased flex flex-col font-sans">
      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

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
            <HelpCircle size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-mono mt-2 uppercase tracking-wide">
            Everything you need to know about security, cookies, and data
          </p>
        </div>

        {/* FAQ Grid list */}
        <div className="space-y-6">
          {/* Item 1 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                <Braces size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                  Is my JSON data sent to any server?
                </h2>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  No. All parsing, minification, tree exploration, and validation are performed <strong>100% locally</strong> inside your browser. We leverage standard Web APIs and client-side scripts to run all operations. Your data never leaves your computer unless you explicitly choose to generate an encrypted sharing link.
                </p>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                <Lock size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                  How does the encryption process for sharing work?
                </h2>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  When you click the Share button, your JSON payload is encrypted directly in your browser using the industry-standard <strong>AES-GCM (256-bit)</strong> algorithm. 
                </p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  The decryption key is generated locally and appended as a <strong>URL fragment (hash) after the `#` character</strong>. Because browser URL hash fragments are never transmitted to our servers (or any database), we host a zero-knowledge repository. Only the people you share the complete URL link with can decrypt and read the contents.
                </p>
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                <Cookie size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                  Do you use cookies?
                </h2>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Yes, but we only use essential &quot;cookies&quot; in the form of local browser persistence (<code>localStorage</code> and <code>sessionStorage</code>). 
                </p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  These storage systems save your active JSON, format settings, editor themes, and viewport configurations locally. Without these local persistence cookies, formatting and parsing would be impossible, as your configuration state would reset on every single interaction or refresh. We never use cookies for marketing or tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                <Database size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                  Where are the shared snippets stored?
                </h2>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  When shared, the encrypted payload is stored in a secure cloud database. Since it is fully encrypted on your machine before upload and contains no unencrypted keys, the stored payload is mathematically useless to us or anyone else. It is only accessible to those holding your exact unique URL containing the decryption hash.
                </p>
              </div>
            </div>
          </div>

          {/* Item 5 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                  How can I delete my shared snippets?
                </h2>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  When you create an encrypted snippet share link, your browser generates and saves an anonymous ownership token in its local history. You can view, search, and delete your shared snippets at any time directly through the local History explorer on the homepage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] font-mono text-zinc-600 select-none mt-12">
        <p>&copy; {new Date().getFullYear()} JSONObject Online. All rights reserved.</p>
      </footer>
    </div>
  );
}
