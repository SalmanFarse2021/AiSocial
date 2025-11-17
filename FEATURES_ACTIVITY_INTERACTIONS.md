# Profile Activity & Interactions Features

## Overview
These features provide users with comprehensive control and visibility over their profile interactions, activity history, and content management.

## Features Implemented

### 1. Activity Log
**Location:** `/profile/activity?tab=activity`

**Description:** Displays a chronological history of all user activities including:
- Posts created
- Likes received on posts
- Comments received on posts

**Functionality:**
- Filter by activity type (all, posts, likes, comments)
- View timestamps in relative format (just now, 5m ago, etc.)
- See post preview with thumbnail
- Sorted by most recent first

**Data Fetched From:**
- `/api/posts/user/:username` - Gets all user posts with engagement metrics

---

### 2. Timeline Review
**Location:** `/profile/activity?tab=timeline`

**Description:** Manage posts you've been tagged in by approving or hiding them from your timeline.

**Functionality:**
- View all pending tagged posts (posts where you haven't taken action yet)
- See who tagged you and the post content
- **Approve**: Keep the post visible on your timeline
- **Hide**: Remove the post from your timeline (hidden from your profile view)
- Automatic removal from pending list after action

**Backend Support:**
- New field in Post model: `userApproval` array
  ```javascript
  userApproval: [
    {
      user: ObjectId,
      status: 'pending' | 'approved' | 'hidden',
      createdAt: Date
    }
  ]
  ```

**API Endpoint:**
- `PATCH /api/posts/:id` with `{ userApprovalAction: 'approve' | 'hide' }`

**Data Fetched From:**
- `/api/posts/tagged/:username` - Gets all posts where user is tagged

---

### 3. Manage Posts
**Location:** `/profile/activity?tab=manage`

**Description:** Bulk management tool for organizing and deleting old or unwanted posts.

**Functionality:**

**Sorting:**
- Newest First (default)
- Oldest First

**Filtering:**
- All Posts
- Older than 3 months
- Older than 6 months
- Older than 1 year

**Actions:**
- **Select/Deselect** individual posts by clicking on thumbnails
- **Select All** to bulk select all visible posts
- **Hide Selected** - Change privacy to 'private' (visible only to you)
- **Delete Selected** - Permanently delete posts (requires confirmation)

**Visual Indicators:**
- Selected posts show sky-blue border and checkmark
- Display timestamps on each thumbnail
- Grid layout (2-3 columns depending on screen size)

**Data Fetched From:**
- `/api/posts/user/:username` - Gets up to 200 user posts

---

## Backend Changes

### Model Updates
**File:** `server/src/models/Post.js`

Added `userApproval` field to track timeline approval status:
```javascript
userApproval: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'hidden'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  },
]
```

### Controller Updates
**File:** `server/src/controllers/post.controller.js`

**Updated `updatePost` function:**
- Accepts `userApprovalAction` parameter ('approve' or 'hide')
- Validates user is tagged in the post
- Creates or updates userApproval entry
- Validates ownership for regular post updates
- Accepts `privacy` field for hiding/showing posts

---

## Frontend Components

### Activity Page
**File:** `client/src/app/profile/activity/page.js`

**Components:**
1. **ActivityLog** - Displays user's activity history with filtering
2. **TimelineReview** - Manages tagged posts approval/hiding
3. **ManagePosts** - Bulk post management interface

**Features:**
- Dark theme with gray-900 background
- Responsive design (mobile & desktop)
- Icon system for visual feedback
- Smooth transitions and hover states
- Real-time selection updates

### Profile Page Integration
**File:** `client/src/app/profile/page.js`

**Changes:**
- Added "Activity & Interactions" button linking to `/profile/activity`
- Updated all form inputs to dark theme (gray-800 backgrounds)
- Improved visual hierarchy

---

## UI/UX Enhancements

### Dark Theme Implementation
- Dark backgrounds: `bg-gray-900`, `bg-gray-800`
- Light text: `text-white`, `text-white/70` for secondary text
- Borders: `border-white/10`, `border-white/20`
- Buttons: Sky-blue for primary actions, gray for secondary
- Hover states for all interactive elements

### Responsive Design
- Mobile-first approach
- Adjustable grid columns (2-3 columns for post management)
- Flexible button layouts
- Readable text on all screen sizes

---

## API Endpoints Used

### Existing Endpoints
- `GET /api/posts/user/:username` - Fetch user posts
- `GET /api/posts/tagged/:username` - Fetch tagged posts
- `DELETE /api/posts/:id` - Delete a post

### Updated Endpoints
- `PATCH /api/posts/:id` - Enhanced to support:
  - `caption`: Update post caption
  - `privacy`: Change post privacy setting
  - `userApprovalAction`: Approve or hide tagged post

---

## Usage Examples

### Activity Log
1. Navigate to Profile Settings
2. Click "Activity & Interactions" button
3. View your activity across posts, likes, and comments
4. Use filters to narrow down activity type
5. Click on activity to see post thumbnail

### Timeline Review
1. Go to Activity & Interactions page
2. Switch to "Timeline Review" tab
3. Review posts you've been tagged in
4. Click "Approve" to keep visible or "Hide" to remove from timeline
5. Pending posts automatically clear after action

### Manage Posts
1. Go to Activity & Interactions page
2. Switch to "Manage Posts" tab
3. Use Sort dropdown (Newest/Oldest First)
4. Use Filter dropdown (Age-based filtering)
5. Click posts to select them (or "Select All")
6. Click "Hide Selected" or "Delete" to take action
7. Confirm deletion in popup dialog

---

## Future Enhancements

1. **Search & Filter**
   - Search posts by caption text
   - Filter by engagement metrics (likes, comments)
   - Filter by post type (post vs reel)

2. **Export Data**
   - Export activity log as CSV/JSON
   - Archive old posts

3. **Analytics**
   - Post performance metrics
   - Engagement trends over time
   - Most liked/commented posts

4. **Notifications**
   - Alert when tagged in posts
   - Reminders for pending timeline approvals

5. **Advanced Editing**
   - Batch edit captions
   - Change privacy for multiple posts at once
   - Add tags or albums to multiple posts

---

## Testing Checklist

- [ ] Activity log displays posts, likes, comments correctly
- [ ] Filtering works for all activity types
- [ ] Timeline review shows only pending tagged posts
- [ ] Approve/Hide actions update correctly
- [ ] Post selection works (single, multiple, select all)
- [ ] Bulk hide updates post privacy
- [ ] Bulk delete shows confirmation and removes posts
- [ ] Age filtering works correctly
- [ ] Sort options work as expected
- [ ] Mobile responsive layout works
- [ ] Dark theme displays correctly
- [ ] Loading states show appropriately
- [ ] Error handling works for failed API calls
