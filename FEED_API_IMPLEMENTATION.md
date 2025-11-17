# Feed & Post System - API Implementation Guide

## Backend Routes Summary

### Post Management Routes
```javascript
// Create new post
POST /api/posts
```

**Request Body**
```json
{
  "caption": "Check out my #adventure!",
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "format": "image",
      "width": 1920,
      "height": 1080
    }
  ],
  "privacy": "public",
  "type": "post",
  "taggedUsernames": ["friend1", "friend2"],
  "albumName": "My Photos",
  "location": {
    "name": "Paris, France",
    "lat": 48.8566,
    "lng": 2.3522
  },
  "feeling": "happy",
  "activity": "traveling"
}
```

**Response (201 Created)**
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f191e810c19729de860ea",
      "username": "johndoe",
      "profilePic": "https://..."
    },
    "caption": "Check out my #adventure!",
    "media": [{ "url": "https://...", "format": "image" }],
    "privacy": "public",
    "type": "post",
    "reactions": [],
    "likedBy": [],
    "commentsCount": 0,
    "taggedUsers": ["507f191e810c19729de860eb"],
    "location": { "name": "Paris, France" },
    "feeling": "happy",
    "activity": "traveling",
    "pinned": false,
    "didLike": false,
    "likes": 0,
    "canDelete": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Feed
```javascript
GET /api/posts/feed?limit=20&cursor=2024-01-15T09:30:00Z
```

**Query Parameters**
| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| limit | number | 20 | 50 |
| cursor | ISO8601 | null | - |

**Response (200 OK)**
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": { "_id": "...", "username": "johndoe" },
      "caption": "Beautiful sunset! 🌅",
      "media": [{ "url": "https://..." }],
      "privacy": "public",
      "reactions": [
        { "user": "507f191e810c19729de860eb", "type": "love", "createdAt": "..." }
      ],
      "commentsCount": 5,
      "didLike": true,
      "likes": 42,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    { "..." }
  ],
  "nextCursor": "2024-01-15T09:30:00Z"
}
```

---

### Get User Posts
```javascript
GET /api/posts/user/:username?limit=24&type=post&cursor=2024-01-15T09:30:00Z
```

**Query Parameters**
| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| limit | number | 1-48 | 24 |
| type | string | 'post', 'reel' | 'post' |
| cursor | ISO8601 | - | null |

**Response (200 OK)**
```json
{
  "posts": [{ /* post objects */ }],
  "nextCursor": "2024-01-15T09:30:00Z"
}
```

---

### Update Post
```javascript
PATCH /api/posts/:id
```

**Update Caption & Privacy (Owner Only)**
```json
{
  "caption": "Updated caption with #newtag",
  "privacy": "friends"
}
```

**Response (200 OK)**
```json
{
  "post": { /* updated post object */ }
}
```

**Tagged User Timeline Approval**
```json
{
  "userApprovalAction": "approve"
}
```

---

### Delete Post
```javascript
DELETE /api/posts/:id
```

**Response (200 OK)**
```json
{
  "ok": true
}
```

**Response (403 Forbidden)**
```json
{
  "message": "Not allowed"
}
```

---

### Pin/Unpin Post
```javascript
POST /api/posts/:id/pin
POST /api/posts/:id/unpin
```

**Response (200 OK)**
```json
{
  "ok": true
}
```

---

## Reaction Routes

### Add or Update Reaction
```javascript
POST /api/posts/:id/react
```

**Request Body**
```json
{
  "type": "love"
}
```

**Reaction Types**
- `like` - 👍
- `love` - ❤️
- `haha` - 😂
- `wow` - 😮
- `sad` - 😢
- `angry` - 😠

**Response (200 OK)**
```json
{
  "ok": true,
  "type": "love"
}
```

**Note**: Only one reaction per user per post. Adding a new reaction removes the old one.

---

### Remove Specific Reaction Type
```javascript
DELETE /api/posts/:id/react/:type
```

**Response (200 OK)**
```json
{
  "ok": true
}
```

---

### Remove All Reactions
```javascript
DELETE /api/posts/:id/react
```

**Response (200 OK)**
```json
{
  "ok": true
}
```

---

## Comment Routes

### Add Comment
```javascript
POST /api/posts/:id/comments
```

**Request Body**
```json
{
  "content": "Great post! @johndoe check this #amazing"
}
```

**Validation**
- Min length: 1 character
- Max length: 1000 characters

**Response (201 Created)**
```json
{
  "comment": {
    "_id": "507f1f77bcf86cd799439012",
    "post": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f191e810c19729de860eb",
      "username": "janedoe",
      "profilePic": "https://..."
    },
    "content": "Great post! @johndoe check this #amazing",
    "replies": [],
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### List Comments
```javascript
GET /api/posts/:id/comments?limit=10
```

**Query Parameters**
| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| limit | number | 10 | 50 |

**Response (200 OK)**
```json
{
  "comments": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "post": "507f1f77bcf86cd799439011",
      "user": { "_id": "...", "username": "janedoe" },
      "content": "Great post!",
      "replies": [
        {
          "user": { "_id": "...", "username": "johndoe" },
          "content": "Thanks!",
          "createdAt": "2024-01-15T11:05:00Z"
        }
      ],
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

### Add Reply to Comment
```javascript
POST /api/posts/:id/comments/:commentId/reply
```

**Request Body**
```json
{
  "content": "I agree! @author #insightful"
}
```

**Response (201 Created)**
```json
{
  "comment": {
    "_id": "507f1f77bcf86cd799439012",
    "post": "507f1f77bcf86cd799439011",
    "user": { "_id": "...", "username": "janedoe" },
    "content": "Great post!",
    "replies": [
      {
        "user": { "_id": "...", "username": "johndoe" },
        "content": "Thanks!",
        "createdAt": "2024-01-15T11:05:00Z"
      },
      {
        "user": { "_id": "...", "username": "alice" },
        "content": "I agree! @author #insightful",
        "createdAt": "2024-01-15T11:10:00Z"
      }
    ],
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## Share Routes

### Share/Reshare Post
```javascript
POST /api/posts/:id/share
```

**Request Body**
```json
{
  "caption": "Check out this amazing photo!"
}
```

**Response (201 Created)**
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439020",
    "user": { "_id": "507f191e810c19729de860ec", "username": "alice" },
    "caption": "Check out this amazing photo!",
    "media": [{ "url": "https://..." }],
    "privacy": "public",
    "sharedFrom": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## Legacy Like Routes

### Like Post
```javascript
POST /api/posts/:id/like
```

**Response (200 OK)**
```json
{
  "likes": 42,
  "didLike": true
}
```

---

### Unlike Post
```javascript
POST /api/posts/:id/unlike
```

**Response (200 OK)**
```json
{
  "likes": 41,
  "didLike": false
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input",
  "issues": [
    {
      "code": "too_big",
      "maximum": 2200,
      "type": "string",
      "path": ["caption"],
      "message": "String must contain at most 2200 character(s)"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "message": "Not allowed"
}
```

### 404 Not Found
```json
{
  "message": "Post not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## Authentication

All endpoints require authentication via middleware.

**Headers Required**
```
Authorization: Bearer <token>
```

**Token Storage** (Client)
```javascript
localStorage.getItem('token')
```

**Middleware Check**
```javascript
// authRequired middleware checks for valid token
```

---

## Rate Limiting

No rate limiting implemented. Consider adding:
- 100 posts per day per user
- 1000 comments per day per user
- 5000 reactions per day per user

---

## Data Validation (Zod Schemas)

### Create Post Schema
```javascript
{
  caption: string.max(2200).optional(),
  type: enum(['post', 'reel']).default('post'),
  media: array({
    url: string.url(),
    width: number.optional(),
    height: number.optional(),
    format: string.optional()
  }).optional(),
  privacy: enum(['public','friends','private','custom']).optional(),
  taggedUsernames: array(string).optional(),
  taggedIds: array(string).optional(),
  albumId: string.optional(),
  albumName: string.max(120).optional(),
  location: object({
    name: string,
    lat: number.min(-90).max(90).optional(),
    lng: number.min(-180).max(180).optional()
  }).optional(),
  feeling: string.max(40).optional(),
  activity: string.max(60).optional()
}
```

### Update Post Schema
```javascript
{
  caption: string.max(2200).optional(),
  privacy: enum(['public','friends','private','custom']).optional(),
  userApprovalAction: enum(['approve', 'hide']).optional()
}
```

### Comment Schema
```javascript
{
  content: string.min(1).max(1000)
}
```

### Reaction Schema
```javascript
{
  type: enum(['like','love','care','haha','wow','sad','angry'])
}
```

---

## Request/Response Flow Examples

### Creating a Post with Image

**Step 1: Upload Image to Cloudinary** (Client)
```javascript
const imageUrl = await uploadImageToCloudinary(file, 'aisocial');
```

**Step 2: Create Post** (Client → Server)
```javascript
const { post } = await apiPost('/api/posts', {
  caption: "Beautiful view! #travel",
  media: [{ url: imageUrl, format: "image" }],
  privacy: "public"
});
```

**Step 3: Response with Post Data** (Server → Client)
```json
{
  "post": {
    "_id": "...",
    "user": { "_id": "...", "username": "..." },
    "caption": "Beautiful view! #travel",
    "media": [{ "url": "https://..." }],
    ...
  }
}
```

**Step 4: Display in Feed** (Client)
- Add post to state
- Render Post component
- Show in feed at top

---

### Liking a Post

**Old Way (Deprecated)**
```javascript
await apiPost(`/api/posts/${postId}/like`);
```

**New Way (Reactions)**
```javascript
await apiPost(`/api/posts/${postId}/react`, {
  type: 'like'
});
```

---

### Adding a Comment with Replies

**Step 1: Add Comment**
```javascript
const { comment } = await apiPost(`/api/posts/${postId}/comments`, {
  content: "Great post! 👍"
});
```

**Step 2: Add Reply**
```javascript
const { comment: updated } = await apiPost(
  `/api/posts/${postId}/comments/${comment._id}/reply`,
  { content: "Thanks!" }
);
```

**Step 3: Both in State**
```javascript
// comment.replies array updated with new reply
setComments([updated, ...otherComments]);
```

---

## Pagination Implementation

### Cursor-Based Pagination

**Initial Load**
```javascript
const { posts, nextCursor } = await apiGet('/api/posts/feed?limit=20');
```

**Load More**
```javascript
const { posts: morePostsData, nextCursor: newCursor } = await apiGet(
  `/api/posts/feed?limit=20&cursor=${nextCursor}`
);
setPosts([...posts, ...morePostsData]);
setNextCursor(newCursor);
```

**Advantages**
- ✅ Efficient for large datasets
- ✅ Handles deleted posts correctly
- ✅ Works well with real-time updates
- ✅ No offset calculation needed

---

## Performance Considerations

### Optimization Strategies

1. **Select Only Needed Fields**
   ```javascript
   .select('username profilePic')
   .lean() // Returns plain JS objects
   ```

2. **Limit Result Set**
   ```javascript
   .limit(limit + 1) // Fetch one extra to know if more exist
   ```

3. **Index Important Fields**
   ```javascript
   index: true // on frequently queried fields
   ```

4. **Batch Operations**
   ```javascript
   await Promise.all([...])
   ```

---

## Frontend Implementation

### Using apiPost
```javascript
const { post } = await apiPost('/api/posts', {
  caption: "Hello world",
  media: [],
  privacy: "public"
});
```

### Using apiPatch
```javascript
const { post } = await apiPatch(`/api/posts/${postId}`, {
  caption: "Updated caption"
});
```

### Using apiDelete
```javascript
await apiDelete(`/api/posts/${postId}`);
```

### Using apiGet
```javascript
const { posts, nextCursor } = await apiGet('/api/posts/feed');
```

---

## Testing Endpoints with cURL

### Create Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Hello world",
    "media": [],
    "privacy": "public"
  }'
```

### Get Feed
```bash
curl -X GET http://localhost:3000/api/posts/feed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Reaction
```bash
curl -X POST http://localhost:3000/api/posts/{postId}/react \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "type": "love" }'
```

### Add Comment
```bash
curl -X POST http://localhost:3000/api/posts/{postId}/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "Great post!" }'
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Complete Implementation
