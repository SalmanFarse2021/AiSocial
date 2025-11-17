# Following System - Quick Reference

## Pages & URLs

| Page | URL | Purpose |
|------|-----|---------|
| Discover | `/discover` | Find & follow new users |
| Following | `/explore/following` | Manage followers/following |
| Profile | `/u/[username]` | View user profile + follow |
| Your Settings | `/profile` | Your profile with stats |
| Feed | `/feed` | Follow from post headers |

## Features at a Glance

### 1. Follow Button Locations
```
✓ Post headers (/feed)
✓ User profiles (/u/[username])
✓ Discover page (/discover)
✓ Following list (/explore/following)
```

### 2. Discover Page (`/discover`)
- Grid layout (3 columns on desktop)
- User cards with stats
- Follow button on each card
- Suggested by algorithm

### 3. Following Page (`/explore/following`)
- Tab 1: Following (users you follow)
- Tab 2: Followers (your followers)
- Tab 3: Suggested (recommendations)
- Quick follow/unfollow

### 4. Profile Page Stats
- Follower count
- Following count
- Link to connections

## Button States

| State | Style | Action |
|-------|-------|--------|
| Not Following | Sky blue button | Click to follow |
| Following | Gray outline button | Click to unfollow |

## API Endpoints

```javascript
// Follow/Unfollow
POST /api/users/:id/follow
POST /api/users/:id/unfollow

// Get suggestions
GET /api/users/suggestions

// Get user data
GET /api/users/me
GET /api/users/profile/:username
GET /api/users/:username/followers
GET /api/users/:username/following
```

## Component Props

### UserCard
```javascript
<UserCard
  user={userObject}
  isFollowing={boolean}
  onFollow={(userId, isFollowing) => {...}}
/>
```

## State Variables

```javascript
// Track following status
const [followingUsers, setFollowingUsers] = useState(new Set());

// Track users list
const [following, setFollowing] = useState([]);
const [followers, setFollowers] = useState([]);
const [suggestions, setSuggestions] = useState([]);

// UI states
const [activeTab, setActiveTab] = useState('following');
const [loading, setLoading] = useState(true);
```

## Common Patterns

### Load Current User
```javascript
const { user } = await apiGet('/api/users/me');
setFollowingUsers(new Set(user.following.map(u => u._id)));
```

### Handle Follow
```javascript
async function handleFollow(userId, isFollowing) {
  try {
    if (isFollowing) {
      await apiPost(`/api/users/${userId}/unfollow`);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      await apiPost(`/api/users/${userId}/follow`);
      setFollowingUsers(prev => new Set(prev).add(userId));
    }
  } catch (e) {
    console.error('Failed:', e);
  }
}
```

### Check if Following
```javascript
const isFollowing = followingUsers.has(userId);
```

## Navigation Links

```javascript
// In Home sidebar
<Link href="/discover">Discover</Link>
<Link href="/explore/following">Following</Link>
<Link href={`/u/${username}`}>Profile</Link>

// On Profiles
<Link href={`/u/${username}`}>View Profile</Link>

// On Cards
<Link href={`/u/${user.username}`}>View Profile →</Link>
```

## Error Scenarios

| Scenario | Handling |
|----------|----------|
| Follow fails | State unchanged, error logged |
| User not found | API returns 404 |
| Already following | Toggle to unfollow |
| Network error | User can retry |

## Performance Tips

1. Use `Set` for O(1) lookups
2. Cache current user data
3. Batch API calls with `Promise.all()`
4. Avoid re-fetching on every render
5. Use lazy loading for suggestions

## Styling Classes

```
// Buttons
bg-sky-600 hover:bg-sky-700         // Follow (primary)
bg-gray-800 border border-white/20  // Following (secondary)

// Text
text-white                          // Primary text
text-white/60 text-white/70         // Secondary text
text-white/40                       // Tertiary text

// Cards
bg-gray-800 border border-white/10  // Card background
hover:border-white/20               // Card hover
rounded-lg                          // Border radius
```

## File Locations

```
📁 client/src/app/
  ├── feed/page.js           (Follow in posts)
  ├── profile/page.js        (Stats widget)
  ├── home/page.js           (Navigation)
  ├── discover/page.js       (Suggested users)
  ├── explore/
  │   └── following/page.js  (Following management)
  └── u/[username]/page.js   (Profile Follow button)

📄 FOLLOWING_SYSTEM_DOCS.md  (Full documentation)
```

## Quick Start for Developers

### Add Follow to New Page
1. Get current user: `const { user } = await apiGet('/api/users/me');`
2. Track following: `const [followingUsers, setFollowingUsers] = useState(new Set());`
3. Add handler: `async function handleFollow(...) {...}`
4. Render button: `<button onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>`

### Create User Card
```javascript
const UserCard = ({ user, isFollowing, onFollow }) => (
  <div>
    <Link href={`/u/${user.username}`}>
      <h3>{user.displayName}</h3>
      <p>@{user.username}</p>
    </Link>
    <button onClick={() => onFollow(user._id, isFollowing)}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  </div>
);
```

## User Journey

```
Home
  ├─→ Discover (/discover)
  │     ├─→ Follow user
  │     ├─→ View profile (/u/[username])
  │     │     ├─→ Follow
  │     │     └─→ View followers/following
  │     └─→ See posts in feed
  │
  ├─→ Following (/explore/following)
  │     ├─→ View my following list
  │     ├─→ View my followers list
  │     └─→ View suggestions
  │
  ├─→ Profile (/profile)
  │     ├─→ See stats (followers, following)
  │     └─→ Click "Connections" link
  │
  └─→ Feed (/feed)
        └─→ Follow directly from posts
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Button doesn't update | Check state update logic |
| Follow fails silently | Add console.error() logging |
| Infinite loop | Use useEffect with dependencies |
| Set persisting across pages | Clear state on unmount |
| API calls not firing | Check authRequired middleware |

---

**Last Updated:** November 10, 2025
**Status:** Complete ✅
**Features:** 5/5 ✅
