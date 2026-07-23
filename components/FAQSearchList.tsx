"use client";

import React, { useState } from "react";
import { Search, X, Braces, Lock, Cookie, Database, ShieldCheck } from "lucide-react";

export default function FAQSearchList() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: "server-data",
      icon: <Braces size={16} />,
      question: "Is my JSON data sent to any server?",
      answer: (
        <>
          No. All parsing, minification, tree exploration, and validation are performed <strong>100% locally</strong> inside your browser. We leverage standard Web APIs and client-side scripts to run all operations. Your data never leaves your computer unless you explicitly choose to generate an encrypted sharing link.
        </>
      ),
      tags: ["server", "privacy", "local", "store", "save", "data"]
    },
    {
      id: "encryption-share",
      icon: <Lock size={16} />,
      question: "How does the encryption process for sharing work?",
      answer: (
        <>
          <p>
            When you click the Share button, your JSON payload is encrypted directly in your browser using the industry-standard <strong>AES-GCM (256-bit)</strong> algorithm.
          </p>
          <p className="mt-2">
            The decryption key is generated locally and appended as a <strong>URL fragment (hash) after the `#` character</strong>. Because browser URL hash fragments are never transmitted to our servers (or any database), we host a zero-knowledge repository. Only the people you share the complete URL link with can decrypt and read the contents.
          </p>
        </>
      ),
      tags: ["encryption", "share", "security", "aes", "gcm", "private key"]
    },
    {
      id: "cookies",
      icon: <Cookie size={16} />,
      question: "Do you use cookies?",
      answer: (
        <>
          <p>
            Yes, but we only use essential &quot;cookies&quot; in the form of local browser persistence (<code>localStorage</code> and <code>sessionStorage</code>).
          </p>
          <p className="mt-2">
            These storage systems save your active JSON, format settings, editor themes, and viewport configurations locally. Without these local persistence cookies, formatting and parsing would be impossible, as your configuration state would reset on every single interaction or refresh. We never use cookies for marketing or tracking.
          </p>
        </>
      ),
      tags: ["cookies", "localStorage", "sessionStorage", "settings", "theme", "tracking"]
    },
    {
      id: "storage-location",
      icon: <Database size={16} />,
      question: "Where are the shared snippets stored?",
      answer: (
        <>
          When shared, the encrypted payload is stored in a secure cloud database. Since it is fully encrypted on your machine before upload and contains no unencrypted keys, the stored payload is mathematically useless to us or anyone else. It is only accessible to those holding your exact unique URL containing the decryption hash.
        </>
      ),
      tags: ["cloud", "storage", "database", "supabase", "encrypted payload"]
    },
    {
      id: "delete-share",
      icon: <ShieldCheck size={16} />,
      question: "How can I delete my shared snippets?",
      answer: (
        <>
          When you create an encrypted snippet share link, your browser generates and saves an anonymous ownership token in its local history. You can view, search, and delete your shared snippets at any time directly through the local History explorer on the homepage.
        </>
      ),
      tags: ["delete", "remove", "history", "snippets", "token"]
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.tags.some(tag => tag.includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-lg mx-auto mb-10 group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-cyan-400 transition-colors duration-200">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQs (e.g. cookies, encryption, local)..."
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-900 border border-zinc-800 focus:border-cyan-500/50 rounded-xl text-xs sm:text-sm text-zinc-200 outline-none transition-all duration-200 font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* FAQ list */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="p-6 rounded-2xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-1 flex-shrink-0">
                  {faq.icon}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
                    {faq.question}
                  </h2>
                  <div className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
              <Search size={20} />
            </div>
            <p className="text-zinc-400 text-sm font-semibold">No FAQs found matching &quot;{searchQuery}&quot;</p>
            <p className="text-zinc-500 text-xs mt-1">Try checking your spelling or searching for a different keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}
