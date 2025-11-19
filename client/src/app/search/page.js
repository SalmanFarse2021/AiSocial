"use client";

import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-sky-400/80">Search</p>
          <h1 className="text-4xl font-bold mt-2">Find people, posts, and groups</h1>
          <p className="text-white/70 mt-3">
            Type a keyword below. This placeholder view just echoes what you type until the backend search
            service is connected.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AiSocial"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-sky-500 focus:outline-none"
        />
        {query && (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-left">
            <p className="text-sm uppercase tracking-widest text-white/50">Preview</p>
            <p className="text-xl font-semibold mt-2">{query}</p>
            <p className="text-white/70 mt-1">Search results will show up here soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
