"use client";
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    connections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/stats/public`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AiSocial
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6">
        <section className="flex flex-col items-center gap-8 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <span className="animate-pulse">✨</span>
            <span>Welcome to the future of social networking</span>
          </div>
          
          <h1 className="max-w-4xl text-5xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-7xl">
            Your social world,
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> brought together</span>
          </h1>
          
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
            Share moments, chat in real-time, and connect with friends — all powered by AI in one beautiful place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link 
              href="/home" 
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-bold text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
            <a 
              href="#features" 
              className="rounded-xl border-2 border-gray-300 dark:border-gray-700 px-8 py-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-200 dark:border-gray-800">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span>{formatNumber(stats.users)}{stats.users >= 1000 ? '+' : ''}</span>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span>{formatNumber(stats.posts)}{stats.posts >= 1000 ? '+' : ''}</span>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Posts Shared</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span>{formatNumber(stats.connections)}{stats.connections >= 1000 ? '+' : ''}</span>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Connections</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-5xl mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features to enhance your social experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: '📱', 
                title: 'Modern Feed', 
                desc: 'Beautiful posts, media, stories and reels with AI-powered captions and content suggestions.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              { 
                icon: '💬', 
                title: 'Real-time Chat', 
                desc: 'Instant messaging, group chats, voice messages, and crystal-clear video calls.',
                gradient: 'from-purple-500 to-pink-500'
              },
              { 
                icon: '🔍', 
                title: 'Smart Discovery', 
                desc: 'Explore trending content, discover new friends, and find communities you love.',
                gradient: 'from-orange-500 to-red-500'
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 text-center shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white md:text-5xl mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                {loading ? (
                  'Join our growing community on AiSocial'
                ) : stats.users > 0 ? (
                  `Join ${formatNumber(stats.users)}+ users already connecting on AiSocial`
                ) : (
                  'Be among the first to join AiSocial'
                )}
              </p>
              <Link 
                href="/login" 
                className="inline-block rounded-xl bg-white px-8 py-4 font-bold text-purple-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Sign Up Now
              </Link>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-12 mt-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AiSocial
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition">About</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Contact</a>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} AiSocial. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
