'use client';
import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/lib/api';
import Icon from './Icon';

// Re-export Icon for backward compatibility
export { default as Icon } from './Icon';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    people: [],
    posts: [],
    hashtags: [],
    groups: [],
    pages: []
  });
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([
    { term: 'AI Technology', count: '12.5K' },
    { term: 'Web Development', count: '8.2K' },
    { term: 'Photography', count: '6.7K' },
    { term: 'Machine Learning', count: '5.4K' },
    { term: 'Travel', count: '4.1K' }
  ]);
  const searchRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiGet('/api/users/me');
        setCurrentUser(data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const data = await apiGet('/api/notifications?limit=1');
        setUnreadNotifications(data.unreadCount || 0);
      } catch (error) {
        // Silently fail if user is not authenticated
      }
    };
    fetchNotificationsCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Search with filters
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setSearching(true);
        try {
          // Search for users/people
          const usersPromise = apiGet(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
          
          // Search for posts (if API exists)
          const postsPromise = apiGet(`/api/posts/search?q=${encodeURIComponent(searchQuery.trim())}`).catch(() => ({ posts: [] }));
          
          // Search for hashtags
          const hashtagsPromise = apiGet(`/api/hashtags/search?q=${encodeURIComponent(searchQuery.trim())}`).catch(() => ({ hashtags: [] }));

          const [usersData, postsData, hashtagsData] = await Promise.all([
            usersPromise,
            postsPromise,
            hashtagsPromise
          ]);

          setSearchResults({
            people: usersData.users || [],
            posts: postsData.posts || [],
            hashtags: hashtagsData.hashtags || [],
            groups: [], // Add when groups API is ready
            pages: [] // Add when pages API is ready
          });

          // Generate suggestions based on results
          const allSuggestions = [
            ...(usersData.users || []).map(u => u.username),
            ...(hashtagsData.hashtags || []).map(h => `#${h.tag}`)
          ].slice(0, 5);
          setSuggestions(allSuggestions);

        } catch (err) {
          console.error('Search error:', err);
          setSearchResults({
            people: [],
            posts: [],
            hashtags: [],
            groups: [],
            pages: []
          });
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults({
          people: [],
          posts: [],
          hashtags: [],
          groups: [],
          pages: []
        });
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const filters = [
    { id: 'all', label: 'All', icon: 'search' },
    { id: 'people', label: 'People', icon: 'user' },
    { id: 'posts', label: 'Posts', icon: 'reels' },
    { id: 'hashtags', label: 'Hashtags', icon: 'hashtag' },
    { id: 'groups', label: 'Groups', icon: 'group' },
    { id: 'pages', label: 'Pages', icon: 'file' }
  ];

  const getFilteredResults = () => {
    if (activeFilter === 'all') {
      return searchResults;
    }
    return {
      ...searchResults,
      people: activeFilter === 'people' ? searchResults.people : [],
      posts: activeFilter === 'posts' ? searchResults.posts : [],
      hashtags: activeFilter === 'hashtags' ? searchResults.hashtags : [],
      groups: activeFilter === 'groups' ? searchResults.groups : [],
      pages: activeFilter === 'pages' ? searchResults.pages : []
    };
  };

  const getTotalResults = () => {
    return Object.values(searchResults).reduce((acc, arr) => acc + arr.length, 0);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };
  return (
    <>
    {/* Desktop Sidebar */}
    <aside className="sticky top-0 hidden h-[100dvh] w-[260px] flex-col overflow-y-auto bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-gray-800 md:flex">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Logo */}
        <a href="/home" className="flex items-center gap-3 px-3 py-4 mb-8 group cursor-pointer">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <Icon name="sparkles" className="h-6 w-6 text-white" filled />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AiSocial
            </span>
          </div>
        </a>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          <a 
            href="/home" 
            className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="home" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-[15px]">Home</span>
          </a>
          
          {/* Search Button */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-full group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="search" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-[15px]">Search</span>
          </button>

          {/* Advanced Search Modal */}
          {searchOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)}></div>
                
                {/* Search Modal */}
                <div className="fixed inset-0 z-[1000000] flex items-start justify-center overflow-y-auto pointer-events-none pt-0 md:pt-0">
                  <div ref={searchRef} className="w-full max-w-4xl mx-auto md:mx-4 mt-[60px] md:mt-4 mb-4 rounded-none md:rounded-2xl border-0 md:border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden pointer-events-auto relative z-[1000001]">
                    {/* Search Header */}
                    <div className="sticky top-[60px] md:top-0 z-[1000002] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl"><Icon name="search" /></span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            saveRecentSearch(searchQuery.trim());
                          }
                        }}
                        placeholder="Search people, posts, hashtags..."
                        autoFocus
                        className="flex-1 bg-transparent text-base md:text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          setActiveFilter('all');
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                      >
                        <Icon name="close" className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Autocomplete Suggestions */}
                    {suggestions.length > 0 && searchQuery && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSearchQuery(sug)}
                            className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setActiveFilter(filter.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-semibold transition-all ${
                            activeFilter === filter.id
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon name={filter.icon} className="h-4 w-4" />
                          <span>{filter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="max-h-[calc(100vh-200px)] md:max-h-[500px] overflow-y-auto">
                    {searching ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin">
                            <Icon name="search" className="h-10 w-10 text-blue-500" />
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">Searching...</div>
                        </div>
                      </div>
                    ) : searchQuery.trim() === '' ? (
                      <div className="px-4 md:px-6 py-6">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Searches</h3>
                              <button
                                onClick={clearRecentSearches}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="space-y-2">
                              {recentSearches.map((term, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSearchQuery(term)}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
                                >
                                  <span className="text-gray-400">�</span>
                                  <span className="text-sm text-gray-900 dark:text-white">{term}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Searches */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">🔥 Trending Now</h3>
                          <div className="space-y-2">
                            {trendingSearches.map((trend, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSearchQuery(trend.term)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{trend.term}</span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{trend.count}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : getTotalResults() === 0 ? (
                      <div className="px-6 py-12">
                        <div className="text-center">
                          <div className="text-4xl mb-3">😔</div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Try searching with different keywords or check your spelling
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 md:px-6 py-4 space-y-6">
                        {/* Results Summary */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            Found {getTotalResults()} results for &quot;{searchQuery}&quot;
                          </h3>
                        </div>

                        {/* People Results */}
                        {getFilteredResults().people.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Icon name="user" className="h-4 w-4" />
                              <span>People ({getFilteredResults().people.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {getFilteredResults().people.map((user) => (
                                <a
                                  key={user._id || user.id}
                                  href={`/u/${user.username}`}
                                  onClick={() => {
                                    saveRecentSearch(searchQuery);
                                    setSearchOpen(false);
                                  }}
                                  className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  {user.profilePic ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={user.profilePic}
                                      alt={user.username}
                                      className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold flex-shrink-0">
                                      {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                      {user.displayName || user.username}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      @{user.username}
                                      {user.bio && ` • ${user.bio.substring(0, 30)}${user.bio.length > 30 ? '...' : ''}`}
                                    </div>
                                  </div>
                                  {user.isFollowing && (
                                    <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">
                                      Following
                                    </div>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Posts Results */}
                        {getFilteredResults().posts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Icon name="reels" className="h-4 w-4" />
                              <span>Posts ({getFilteredResults().posts.length})</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getFilteredResults().posts.map((post) => (
                                <a
                                  key={post._id || post.id}
                                  href={`/p/${post._id || post.id}`}
                                  onClick={() => saveRecentSearch(searchQuery)}
                                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                                      {post.user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                      {post.user?.username || 'User'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                    {post.caption || post.content || 'No caption'}
                                  </p>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hashtags Results */}
                        {getFilteredResults().hashtags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Icon name="hashtag" className="h-4 w-4" />
                              <span>Hashtags ({getFilteredResults().hashtags.length})</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {getFilteredResults().hashtags.map((tag, idx) => (
                                <a
                                  key={idx}
                                  href={`/hashtag/${tag.tag || tag}`}
                                  onClick={() => saveRecentSearch(searchQuery)}
                                  className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-semibold text-sm"
                                >
                                  #{tag.tag || tag}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
            )}

          <a 
            href="/videos" 
            className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="reels" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-[15px]">Videos</span>
          </a>
          <a 
            href="/messages" 
            className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="send" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-[15px]">Messages</span>
          </a>
          <a 
            href="/notifications" 
            className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
          >
            <div className="flex h-9 w-9 items-center justify-center relative">
              <Icon name="heart" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </div>
            <span className="font-semibold text-[15px]">Notifications</span>
          </a>
          <a 
            href={currentUser?.username ? `/u/${currentUser.username}` : '/profile'} 
            className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="user" className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-semibold text-[15px]">Profile</span>
          </a>
        </nav>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Logout Section */}
        <div className="mt-auto pt-4">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="group w-full flex items-center gap-3.5 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <Icon name="logout" className="h-6 w-6" />
            </div>
            <span className="font-semibold text-[15px]">Logout</span>
          </button>
        </div>
      </div>
    </aside>

    {/* Mobile Top Navbar */}
    <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <a href="/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-md">
            <Icon name="sparkles" className="h-5 w-5 text-white" filled />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AiSocial
          </span>
        </a>

        {/* Mobile Navigation Icons */}
        <div className="flex items-center gap-1">
          <a 
            href="/home" 
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Icon name="home" className="h-6 w-6" />
          </a>
          <button 
            onClick={() => setSearchOpen(true)}
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Icon name="search" className="h-6 w-6" />
          </button>
          <a 
            href="/videos" 
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Icon name="reels" className="h-6 w-6" />
          </a>
          <a 
            href="/messages" 
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Icon name="send" className="h-6 w-6" />
          </a>
          <a 
            href="/notifications" 
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
          >
            <Icon name="heart" className="h-6 w-6" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-1 ring-white dark:ring-slate-950">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </a>
          <a 
            href={currentUser?.username ? `/u/${currentUser.username}` : '/profile'} 
            className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Icon name="user" className="h-6 w-6" />
          </a>
        </div>
      </div>
    </nav>
    </>
  );
}
