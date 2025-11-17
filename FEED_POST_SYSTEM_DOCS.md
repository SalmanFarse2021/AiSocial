# Feed & Post System - Complete Documentation

## Overview

The Feed & Post System is a comprehensive social media posting and interaction platform featuring:
- Post creation with text, image, video, and link support
- Rich text editing with hashtags and mentions
- 6 reaction types (Like, Love, Haha, Wow, Sad, Angry)
- Nested comments with threaded replies
- Post visibility controls (Public, Friends, Private)
- Share/Reshare functionality
- Edit/Delete post capabilities

## Frontend Implementation

### Post Creator Component (`/client/src/app/feed/page.js`)

#### Features
- **Text Input**: Textarea for caption with support for @mentions and #hashtags
- **Media Upload**: Support for images, videos, and links
- **Privacy Controls**: Dropdown to select visibility level
- **Media Preview**: Live preview of images/videos before posting
- **Edit Mode**: Can edit caption and privacy settings for existing posts

#### Usage
```jsx
<PostCreator 
  onPostCreated={handlePostCreated}
  editingPost={post}
  onEditDone={handleEditDone}
/>
```

### Post Component

#### Features
- **User Information**: Display username, timestamp, and privacy level
- **Content Display**: Render rich text with parsed hashtags and mentions
- **Media Display**: Images and videos rendered with proper sizing
- **Reactions Summary**: Show count of each reaction type
- **Action Buttons**: React, Comment, Share options
- **Post Menu**: Edit and delete options via dropdown

#### Hashtags & Mentions
- Hashtags (e.g., `#travel`) are parsed and linked to `/explore?tag=travel`
- Mentions (e.g., `@username`) are parsed and linked to `/u/username`
- Auto-parsed using regex pattern: `/@\w+|#\w+/g`

#### Reactions System
```
- 👍 Like
- ❤️ Love
- 😂 Haha
- 😮 Wow
- 😢 Sad
- 😠 Angry
```

Reactions are cumulative - users can only have one reaction per type per post.

### Comments Component

#### Features
- **Comment Input**: Text field to add comments
- **Nested Replies**: Click "Reply" to add threaded responses
- **Comment Display**: Shows username, content, and timestamp
- **Replies Thread**: Replies indented under parent comment

#### Data Structure
```javascript
{
  _id: ObjectId,
  post: ObjectId,
  user: { username, profilePic },
  content: String,
  replies: [
    {
      user: { username, profilePic },
      content: String,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Rich Text Renderer (`RichText` Component)

Automatically parses and renders:
- Plain text
- Mentions (@username) - linked to user profiles
- Hashtags (#tag) - linked to tag search

```jsx
<RichText text={post.caption} />
```

## Backend Implementation

### Database Models

#### Post Schema
```javascript
{
  user: ObjectId,
  caption: String,
  media: [{ url, format, width?, height? }],
  privacy: 'public'|'friends'|'private'|'custom',
  type: 'post'|'reel',
  reactions: [{ user, type, createdAt }],
  likedBy: [ObjectId],
  commentsCount: Number,
  taggedUsers: [ObjectId],
  sharedFrom: ObjectId?,
  location: { name, point },
  feeling: String?,
  activity: String?,
  album: ObjectId?,
  pinned: Boolean,
  pinnedAt: Date?,
  userApproval: [{ user, status }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Comment Schema
```javascript
{
  post: ObjectId,
  user: ObjectId,
  content: String,
  replies: [
    {
      user: ObjectId,
      content: String,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Post Operations

**Create Post**
```
POST /api/posts
Body: {
  caption?: String,
  media?: [{ url, format, width?, height? }],
  privacy?: 'public'|'friends'|'private'|'custom',
  type?: 'post'|'reel'
}
Response: { post: PostObject }
```

**Get Feed**
```
GET /api/posts/feed?limit=20&cursor=ISO8601Date
Response: { posts: [PostObject], nextCursor: Date? }
```

**Get User Posts**
```
GET /api/posts/user/:username?limit=24&type=post&cursor=ISO8601Date
Response: { posts: [PostObject], nextCursor: Date? }
```

**Update Post** (caption, privacy, or user approval)
```
PATCH /api/posts/:id
Body: {
  caption?: String,
  privacy?: String,
  userApprovalAction?: 'approve'|'hide'
}
Response: { post: PostObject }
```

**Delete Post**
```
DELETE /api/posts/:id
Response: { ok: true }
```

#### Reaction Operations

**Add/Update Reaction**
```
POST /api/posts/:id/react
Body: { type: 'like'|'love'|'haha'|'wow'|'sad'|'angry' }
Response: { ok: true, type: String }
```

**Remove Specific Reaction Type**
```
DELETE /api/posts/:id/react/:type
Response: { ok: true }
```

**Remove All Reactions**
```
DELETE /api/posts/:id/react
Response: { ok: true }
```

#### Comment Operations

**Add Comment**
```
POST /api/posts/:id/comments
Body: { content: String }
Response: { comment: CommentObject }
```

**List Comments**
```
GET /api/posts/:id/comments?limit=10
Response: { comments: [CommentObject] }
```

**Add Reply to Comment**
```
POST /api/posts/:id/comments/:commentId/reply
Body: { content: String }
Response: { comment: CommentObject }
```

#### Sharing

**Share/Reshare Post**
```
POST /api/posts/:id/share
Body: { caption?: String }
Response: { post: PostObject }
```

#### Pinning

**Pin Post** (only owner can pin)
```
POST /api/posts/:id/pin
Response: { ok: true }
```

**Unpin Post**
```
POST /api/posts/:id/unpin
Response: { ok: true }
```

#### Legacy Like System

**Like Post**
```
POST /api/posts/:id/like
Response: { likes: Number, didLike: boolean }
```

**Unlike Post**
```
POST /api/posts/:id/unlike
Response: { likes: Number, didLike: boolean }
```

## UI Components Structure

### Feed Page (`/feed`)
```
FeedPage (main container)
├─ PostCreator (create/edit posts)
└─ Posts List
   ├─ Post #1
   │  ├─ Header (user info, menu)
   │  ├─ Content (caption, media)
   │  ├─ Reactions Summary
   │  ├─ Action Buttons (react, comment, share)
   │  └─ Comments Section (expandable)
   │     ├─ Comment Input
   │     └─ Comments List
   │        └─ Comment (with replies)
   ├─ Post #2
   └─ ...
```

### Component Hierarchy

```
FeedPage
├─ PostCreator
│  ├─ Textarea
│  ├─ Media Input
│  ├─ Privacy Selector
│  └─ Submit Button
├─ Post
│  ├─ Header
│  │  ├─ Avatar
│  │  ├─ Username
│  │  ├─ Timestamp
│  │  └─ Menu Button
│  ├─ Content
│  │  ├─ RichText (caption)
│  │  └─ Media (image/video)
│  ├─ Reactions Summary
│  ├─ Actions
│  │  ├─ ReactionPicker
│  │  ├─ Comment Button
│  │  └─ Share Button
│  └─ Comments Section (conditional)
│     ├─ Comment Input
│     └─ Comment
│        ├─ Author Info
│        ├─ Content (RichText)
│        └─ Replies (nested)
├─ Post (next)
└─ ...
```

## Usage Examples

### Creating a Post with Image
```javascript
const payload = {
  caption: "Check out my #travel #adventure with @friend",
  media: [{ 
    url: "https://example.com/image.jpg", 
    format: "image" 
  }],
  privacy: "public"
};
const { post } = await apiPost('/api/posts', payload);
```

### Adding a Reaction
```javascript
const { ok, type } = await apiPost(`/api/posts/${postId}/react`, {
  type: 'love'
});
```

### Adding a Comment with Reply
```javascript
// Add comment
const { comment } = await apiPost(`/api/posts/${postId}/comments`, {
  content: "Great post! 👍"
});

// Add reply to comment
const { comment: updated } = await apiPost(
  `/api/posts/${postId}/comments/${comment._id}/reply`,
  { content: "Thanks!" }
);
```

### Sharing a Post
```javascript
const { post: shared } = await apiPost(`/api/posts/${postId}/share`, {
  caption: "Check this out! 📸"
});
```

## Features Breakdown

### 1. Post Creation ✅
- Text with hashtags and mentions
- Image upload with preview
- Video upload with preview
- Link sharing
- Privacy controls (public, friends, private)

### 2. Post Display ✅
- Rich text rendering with parsed hashtags/mentions
- Media display (images, videos)
- User info and timestamp
- Privacy indicator
- Reaction counts

### 3. Reactions ✅
- 6 reaction types (Like, Love, Haha, Wow, Sad, Angry)
- Visual reaction picker
- Aggregate reaction counts
- One reaction type per user

### 4. Comments ✅
- Add comments to posts
- View all comments
- Nested replies with threading
- Rich text in comments
- Reply count tracking

### 5. Share/Reshare ✅
- Reshare posts to timeline
- Optional caption with reshare
- Tracks original post via sharedFrom

### 6. Post Management ✅
- Edit post (caption, privacy)
- Delete post
- Pin/Unpin post
- Edit mode in post creator

### 7. Visibility Controls ✅
- Public (everyone)
- Friends only
- Private (only me)
- Custom (planned)

### 8. Hashtags & Mentions ✅
- Auto-parse hashtags and mentions
- Links to tag search
- Links to user profiles
- Highlighted in blue

## Styling

All components use:
- **Dark Theme**: bg-gray-900, bg-gray-800, text-white
- **Accents**: sky-600 for primary, sky-400 for links
- **Borders**: border-white/10 for subtle borders
- **Tailwind CSS**: Responsive, mobile-first design

### Color Scheme
- Background: #111827 (gray-900)
- Card Background: #111827 (gray-900) with white/10 border
- Text: white (text-white)
- Primary: #0ea5e9 (sky-600)
- Accent Links: #0284c7 (sky-400)
- Hover: bg-gray-800, text-white

## Performance Optimizations

1. **Lazy Loading**: Comments load on demand
2. **Pagination**: Feed uses cursor-based pagination
3. **Lean Queries**: Database queries use .lean() where possible
4. **Conditional Rendering**: Comments section only renders when expanded
5. **Media Preview**: Local preview before upload

## File Locations

- **Frontend**: `/client/src/app/feed/page.js`
- **Controller**: `/server/src/controllers/post.controller.js`
- **Models**: 
  - `/server/src/models/Post.js`
  - `/server/src/models/Comment.js`
- **Routes**: `/server/src/routes/post.routes.js`

## Next Steps & Future Enhancements

1. **Video Streaming**: Add video transcoding and streaming support
2. **Hashtag Analytics**: Track trending hashtags
3. **Advanced Search**: Search by hashtag, user, date range
4. **Post Notifications**: Notify when tagged, commented on, reacted to
5. **Post Analytics**: View counts, engagement metrics
6. **Advanced Editing**: Batch edit multiple posts
7. **Collections**: Save posts to collections
8. **Moderation**: Flag/report inappropriate content
9. **Scheduled Posts**: Schedule posts for later
10. **Story Posts**: Temporary posts (24hr)

## Testing Checklist

- [x] Post creation with text
- [x] Post creation with image
- [x] Post creation with video
- [x] Post privacy controls
- [x] Post editing (caption, privacy)
- [x] Post deletion
- [x] Reactions (all 6 types)
- [x] Comments
- [x] Comment replies
- [x] Hashtag parsing and linking
- [x] Mention parsing and linking
- [x] Share/Reshare
- [x] Pin/Unpin posts
- [x] Feed pagination
- [x] Dark theme consistency
- [x] Mobile responsiveness

## API Response Examples

### Create Post Response
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f191e810c19729de860ea",
      "username": "johndoe",
      "profilePic": "https://..."
    },
    "caption": "Beautiful sunset! #sunset #nature",
    "media": [{ 
      "url": "https://example.com/image.jpg",
      "format": "image"
    }],
    "privacy": "public",
    "reactions": [],
    "commentsCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Feed Response
```json
{
  "posts": [
    { /* post object */ },
    { /* post object */ }
  ],
  "nextCursor": "2024-01-15T09:30:00Z"
}
```

### Add Comment Response
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
    "content": "Amazing shot! 📸",
    "replies": [],
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

## Error Handling

Common errors and responses:

| Error | Status | Message |
|-------|--------|---------|
| Missing text/media | 400 | "Please add text or media" |
| Post not found | 404 | "Post not found" |
| Unauthorized delete | 403 | "Not allowed" |
| Invalid reaction type | 400 | "Invalid reaction" |
| Comment too long | 400 | "Invalid input" |

## Accessibility Features

- ✅ Semantic HTML (article, header, nav)
- ✅ ARIA labels on buttons
- ✅ Keyboard support (links, buttons)
- ✅ Color contrast (white on gray-900)
- ✅ Focus states on interactive elements

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
