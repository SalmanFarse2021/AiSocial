"use client";

import Link from 'next/link';

export default function ExplorePage() {
  const cards = [
    { title: 'Discover Creators', description: 'Find new people and communities to follow', href: '/discover' },
    { title: 'Trending Posts', description: 'See what is popular across AiSocial right now', href: '/trending' },
    { title: 'Friend Suggestions', description: 'People you may know based on mutual friends', href: '/friends/suggestions' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <header>
          <p className="text-sm uppercase tracking-widest text-sky-400/80">Explore</p>
          <h1 className="text-4xl font-bold mt-2">See what&apos;s happening</h1>
          <p className="text-white/70 mt-3 max-w-2xl">
            Jump into new conversations, follow interesting creators, and keep up with what your friends
            are sharing on AiSocial.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="block rounded-2xl border border-white/5 bg-white/5 p-6 hover:border-sky-500/70 hover:bg-white/10 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
              <p className="text-white/70 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
