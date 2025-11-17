# Following System - API Reference

## Authentication
All endpoints require `authRequired` middleware.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## POST /api/users/:id/follow

**Description:** Follow a user

**Parameters:**
| Name | Type | Location | Required |
|------|------|----------|----------|
| id | String | URL | Yes |

**Request:**
```bash
curl -X POST http://localhost:5000/api/users/123/follow \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "User followed successfully",
  "following": [
    {
      "_id": "123",
      "username": "john_doe",
      "displayName": "John Doe",
      "bio": "Developer"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Cannot follow yourself"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

## POST /api/users/:id/unfollow

**Description:** Unfollow a user

**Parameters:**
| Name | Type | Location | Required |
|------|------|----------|----------|
| id | String | URL | Yes |

**Request:**
```bash
curl -X POST http://localhost:5000/api/users/123/unfollow \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "User unfollowed successfully",
  "following": [
    {
      "_id": "456",
      "username": "jane_doe",
      "displayName": "Jane Doe"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Not following this user"
}
```

---

## GET /api/users/suggestions

**Description:** Get suggested users to follow

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| limit | Number | 20 | Number of suggestions |
| skip | Number | 0 | Pagination offset |

**Request:**
```bash
curl http://localhost:5000/api/users/suggestions?limit=20 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "_id": "789",
      "username": "dev_community",
      "displayName": "Dev Community",
      "bio": "For developers by developers",
      "followers": [50, 60, 70],
      "following": [100, 200],
      "profilePic": "https://...",
      "mutualCount": 5
    },
    {
      "_id": "790",
      "username": "tech_news",
      "displayName": "Tech News Daily",
      "bio": "Latest tech updates"
    }
  ]
}
```

**Algorithm:**
- Users with mutual followers
- Users in your network
- Popular users
- Randomly selected new users
- Excludes: yourself, already following, blocked users

---

## GET /api/users/me

**Description:** Get current authenticated user

**Request:**
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "currentUserId",
    "username": "current_user",
    "displayName": "Current User",
    "email": "user@example.com",
    "bio": "My bio",
    "profilePic": "https://...",
    "followers": [
      {
        "_id": "456",
        "username": "follower1",
        "displayName": "Follower One"
      }
    ],
    "following": [
      {
        "_id": "789",
        "username": "following1",
        "displayName": "Following One"
      }
    ],
    "followerCount": 150,
    "followingCount": 75,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## GET /api/users/profile/:username

**Description:** Get specific user's profile

**Parameters:**
| Name | Type | Location | Required |
|------|------|----------|----------|
| username | String | URL | Yes |

**Request:**
```bash
curl http://localhost:5000/api/users/profile/john_doe \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "123",
    "username": "john_doe",
    "displayName": "John Doe",
    "bio": "Developer & Designer",
    "website": "https://johndoe.com",
    "city": "San Francisco",
    "country": "USA",
    "followers": [456, 789],
    "following": [100, 200, 300],
    "isFollowing": true,
    "isFollowedBy": false,
    "mutualFollows": 5,
    "profilePic": "https://...",
    "coverPhoto": "https://...",
    "counts": {
      "posts": 42,
      "followers": 2,
      "following": 3
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

## GET /api/users/:username/followers

**Description:** List user's followers

**Parameters:**
| Name | Type | Location | Required |
|------|------|----------|----------|
| username | String | URL | Yes |
| limit | Number | Query | No (default: 20) |
| skip | Number | Query | No (default: 0) |

**Request:**
```bash
curl http://localhost:5000/api/users/john_doe/followers?limit=20&skip=0 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "_id": "456",
      "username": "user1",
      "displayName": "User One",
      "profilePic": "https://...",
      "mutualCount": 3
    },
    {
      "_id": "789",
      "username": "user2",
      "displayName": "User Two",
      "profilePic": "https://...",
      "mutualCount": 1
    }
  ],
  "total": 150,
  "limit": 20,
  "skip": 0
}
```

---

## GET /api/users/:username/following

**Description:** List users someone is following

**Parameters:**
| Name | Type | Location | Required |
|------|------|----------|----------|
| username | String | URL | Yes |
| limit | Number | Query | No (default: 20) |
| skip | Number | Query | No (default: 0) |

**Request:**
```bash
curl http://localhost:5000/api/users/john_doe/following?limit=20 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "_id": "100",
      "username": "tech_daily",
      "displayName": "Tech Daily",
      "bio": "Tech news",
      "profilePic": "https://...",
      "followers": [456, 789, 100],
      "isFollowing": true
    }
  ],
  "total": 75,
  "limit": 20,
  "skip": 0
}
```

---

## Data Models

### User Follow Fields
```javascript
{
  followers: [
    {
      _id: ObjectId,
      username: String,
      displayName: String,
      profilePic: String,
      bio: String
    }
  ],
  
  following: [
    {
      _id: ObjectId,
      username: String,
      displayName: String,
      profilePic: String,
      bio: String
    }
  ]
}
```

### Response Types

**UserPreview:**
```json
{
  "_id": "ObjectId",
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "profilePic": "string",
  "followers": ["ObjectId"],
  "following": ["ObjectId"],
  "mutualCount": "number"
}
```

**UserFull:**
```json
{
  "_id": "ObjectId",
  "username": "string",
  "displayName": "string",
  "email": "string",
  "bio": "string",
  "profilePic": "string",
  "coverPhoto": "string",
  "website": "string",
  "city": "string",
  "country": "string",
  "followers": ["ObjectId"],
  "following": ["ObjectId"],
  "isFollowing": "boolean",
  "isFollowedBy": "boolean",
  "mutualFollows": "number",
  "counts": {
    "posts": "number",
    "followers": "number",
    "following": "number"
  }
}
```

---

## Error Handling

### Common Errors

| Code | Error | Cause |
|------|-------|-------|
| 400 | Cannot follow yourself | User trying to follow their own account |
| 400 | Already following | User already follows target |
| 400 | Not following this user | Trying to unfollow someone you don't follow |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User is blocked |
| 404 | User not found | Target user doesn't exist |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Server error | Database or server issue |

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

## Rate Limiting

**Follow/Unfollow:** 50 requests per minute per user
**Get Suggestions:** 10 requests per minute per user
**Get Followers/Following:** 100 requests per minute per user

**Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1609459260
```

---

## Example Implementation

### JavaScript (Fetch API)
```javascript
// Follow user
async function followUser(userId) {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Get suggestions
async function getSuggestions(limit = 20) {
  const response = await fetch(
    `/api/users/suggestions?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
}

// Get user followers
async function getUserFollowers(username, limit = 20) {
  const response = await fetch(
    `/api/users/${username}/followers?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
}
```

### React Pattern
```javascript
const [following, setFollowing] = useState(false);

async function handleFollow(userId) {
  try {
    const endpoint = following
      ? `/api/users/${userId}/unfollow`
      : `/api/users/${userId}/follow`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      setFollowing(!following);
    }
  } catch (error) {
    console.error('Follow failed:', error);
  }
}
```

---

## Caching Strategy

### Client-Side Caching
```javascript
// Cache following status
const cache = new Map();

function getCachedFollowing(userId) {
  return cache.get(userId);
}

function setCachedFollowing(userId, isFollowing) {
  cache.set(userId, isFollowing);
}

// Clear cache after 5 minutes
setTimeout(() => cache.clear(), 5 * 60 * 1000);
```

---

## Performance Considerations

1. **Batch Requests:** Use Promise.all() to fetch multiple users
2. **Pagination:** Use limit/skip for large lists
3. **Caching:** Cache suggestion results locally
4. **Optimistic Updates:** Update UI before API confirms
5. **Lazy Loading:** Load followers on demand

---

## Webhooks (Future)

```
POST /api/webhooks/follow
POST /api/webhooks/unfollow

Payload:
{
  "event": "user.follow",
  "follower": { userId },
  "followee": { userId },
  "timestamp": "ISO8601"
}
```

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
**Status:** Complete ✅
