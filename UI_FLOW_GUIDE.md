# UI Flow & Navigation Guide

## 🗺️ User Journey

### Entry Point
```
Profile Settings Page (/profile)
         ↓
    [Activity & Interactions Button]
         ↓
Activity Page (/profile/activity)
```

---

## 📱 Activity Page Layout

```
┌─────────────────────────────────────────────────┐
│  ← Activity & Interactions                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  [ Activity Log ] [ Timeline... ] [ Manage... ]│
│      └─ underline                              │
│                                                 │
├─────────────────────────────────────────────────┤
│  [all] [posts] [likes] [comments]              │ ← Filters
├─────────────────────────────────────────────────┤
│                                                 │
│  ❤️  Received 5 likes                           │ ← Activity Item
│     "Check out my new post..."                 │
│     5m ago                        [thumbnail]  │
│  ─────────────────────────────────────────────│
│                                                 │
│  ✓  Created a post                             │ ← Activity Item
│     "Just posted..."                           │
│     2h ago                        [thumbnail]  │
│  ─────────────────────────────────────────────│
│                                                 │
│                    [Load More...]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Timeline Review Tab

```
┌─────────────────────────────────────────────────┐
│  Review and manage posts you've been tagged in  │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 john_doe tagged you                        │ ← Tagged Post
│     "Weekend adventure at the beach..."        │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │        [Post Image Preview]             │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│  [✓ Approve] [👁️ Hide]                        │
│  ─────────────────────────────────────────────│
│                                                 │
│  👤 sarah tagged you                           │ ← Tagged Post
│     "Fun times with the crew..."              │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │        [Post Image Preview]             │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│  [✓ Approve] [👁️ Hide]                        │
│  ─────────────────────────────────────────────│
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗂️ Manage Posts Tab

```
┌─────────────────────────────────────────────────┐
│  [Sort: Newest▼] [Filter: All Posts▼]          │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Select All]                                  │
│                                                 │
│  ┌────┐ ┌────┐ ┌────┐                          │
│  │    │ │ ✓  │ │    │   ← Grid Layout         │
│  │ 5d │ │3d  │ │ 1w │   ← Timestamps         │
│  │ago │ │ago │ │ago │   ← Selected (blue)    │
│  └────┘ └────┘ └────┘                          │
│  ┌────┐ ┌────┐ ┌────┐                          │
│  │    │ │    │ │ ✓  │                          │
│  │ 2w │ │ 3w │ │ 1m │                          │
│  │ago │ │ago │ │ago │                          │
│  └────┘ └────┘ └────┘                          │
│  ┌────┐ ┌────┐ ┌────┐                          │
│  │    │ │    │ │    │                          │
│  │ 2m │ │ 3m │ │ 4m │                          │
│  │ago │ │ago │ │ago │                          │
│  └────┘ └────┘ └────┘                          │
│                                                 │
│  ────────────────────────────────────────────  │
│  2 posts selected                              │
│  [Hide Selected] [🗑️ Delete]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Activity Log Flow
```
User clicks "Activity & Interactions"
              ↓
Page loads with activity tab active
              ↓
Fetch /api/users/me (get current user)
              ↓
Fetch /api/posts/user/:username?limit=100
              ↓
Process posts to create activity items
              ↓
Render activities with filters
              ↓
User clicks filter button
              ↓
Re-render filtered activities
```

### Timeline Review Flow
```
User switches to Timeline Review tab
              ↓
Fetch /api/posts/tagged/:username
              ↓
Filter to pending posts only
              ↓
Render tagged posts
              ↓
User clicks "Approve" or "Hide"
              ↓
PATCH /api/posts/:id { userApprovalAction }
              ↓
Remove post from list
              ↓
Show success (implicit)
```

### Manage Posts Flow
```
User switches to Manage Posts tab
              ↓
Fetch /api/posts/user/:username?limit=200
              ↓
Sort by "newest" (default)
              ↓
Render all posts in grid
              ↓
User selects sort/filter options
              ↓
Re-sort/re-filter locally
              ↓
User selects posts (click toggles)
              ↓
Show selection counter & action buttons
              ↓
User clicks "Hide" or "Delete"
              ↓
If delete: Show confirmation
              ↓
Send PATCH (for hide) or DELETE (for delete)
              ↓
Update list immediately
              ↓
Clear selection
```

---

## 🎨 Color Scheme & Visual Elements

### Backgrounds
```
Page Background      → #111827 (bg-gray-900)
Card Background      → rgba(255,255,255,0.05) with backdrop blur
Input Background     → #1f2937 (bg-gray-800)
Active Background    → rgba(255,255,255,0.10)
```

### Text Colors
```
Primary Text         → #ffffff (text-white)
Secondary Text       → rgba(255,255,255,0.7) (text-white/70)
Tertiary Text        → rgba(255,255,255,0.5) (text-white/50)
```

### Accent Colors
```
Primary Action       → #0ea5e9 (bg-sky-600)
Primary Hover        → #0284c7 (bg-sky-700)
Danger Action        → #dc2626 (bg-red-600)
Danger Hover         → #b91c1c (bg-red-700)
Success Icon         → #06b6d4 (text-sky-400)
```

### Borders
```
Card Border          → border-white/10
Input Border         → border-white/20
Focus Border         → border-sky-500
Selected Border       → border-sky-500 (2px)
```

---

## 📊 State Transitions

### Activity Log States
```
┌─────────────┐
│   LOADING   │
└──────┬──────┘
       ↓
┌──────────────────┐
│  EMPTY / DATA    │
└────────┬─────────┘
         ↓
    [Filter Click]
         ↓
    ← Stays in same state, re-render with filter
```

### Manage Posts Selection States
```
┌─────────────────┐
│  UNSELECTED     │ ← Normal appearance
└────────┬────────┘
         │ [Click Post]
         ↓
┌─────────────────┐
│  SELECTED       │ ← Blue border + checkmark
└────────┬────────┘
         │ [Click Again]
         ↓
┌─────────────────┐
│  UNSELECTED     │
└─────────────────┘
```

---

## 🔤 Typography

### Headings
```
Page Title        → 30px, Bold, White
Section Title     → 20px, Semibold, White
Tab Label         → 14px, Medium, White (or white/70)
```

### Body Text
```
Primary Text      → 14px, Normal, White
Secondary Text    → 14px, Normal, White/70
Caption Text      → 12px, Normal, White/50
Small Text        → 10px, Normal, White/50
```

### Button Text
```
Button Label      → 14px, Medium, depends on button type
```

---

## 🖱️ Interaction Patterns

### Buttons
```
Normal     → bg-color with hover:bg-darker
Disabled   → opacity-70, cursor-not-allowed
Loading    → Show spinner (implicit in text like "Posting...")
Focus      → ring-2 ring-sky-500/50
```

### Inputs & Selects
```
Normal     → bg-gray-800, border-white/20
Focus      → border-sky-500
Error      → border-red-500 (not implemented)
Disabled   → opacity-70
```

### Cards
```
Normal Hover → subtle bg change (none by default)
Click        → visual feedback (toggles selection)
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)
```
Layout     → Single column, full width
Grid       → 2 columns for post thumbnails
Buttons    → Full width or stacked
Typography → Slightly smaller
Spacing    → Reduced padding
```

### Tablet (640px - 1024px)
```
Layout     → Single or 2-column
Grid       → 2-3 columns for posts
Buttons    → Inline where possible
Typography → Normal size
Spacing    → Moderate padding
```

### Desktop (> 1024px)
```
Layout     → Full width with max constraints
Grid       → 3 columns for posts
Buttons    → Inline with normal spacing
Typography → Full size
Spacing    → Generous padding
```

---

## 🎯 Touch Interactions (Mobile)

### Touch Targets
```
Button Size        → Minimum 44x44px (larger for better UX)
Tap Feedback       → Color change immediately
Long Press         → (Future: context menu)
Swipe              → (Future: pagination)
```

---

## ⌨️ Keyboard Navigation (Desktop)

### Accessibility
```
Tab               → Move through elements
Enter             → Activate button/action
Escape            → (Future: close modals)
Space             → (Future: select item)
```

---

## 🌙 Dark Mode Implementation

### How It Works
```
Base layer uses dark colors directly (no light mode)
All elements use:
  - bg-gray-900 (page bg)
  - bg-gray-800 (inputs)
  - text-white (text)
  - border-white/XX (borders)
  - bg-sky-600 (primary accent)

No conditional classes like:
  - dark:bg-black (not needed)
  - dark:text-white (not needed)
```

---

## 🔐 Security Considerations

### Data Display
```
Only show user's own posts in manage section
Only show posts tagged with current user in timeline review
Show only own activities in activity log
```

### API Calls
```
Include auth headers automatically
Validate user ownership server-side
Validate tagging relationships server-side
Use HTTPS for all requests
```

---

## 📈 Performance Optimizations

### Data Fetching
```
Limit: 100 posts for activity (prevents huge loads)
Limit: 200 posts for manage (sufficient for bulk ops)
Lean queries: Server-side optimization
```

### Frontend
```
Set-based selection: O(1) lookup/add/remove
Event delegation: Minimize event listeners
Lazy rendering: Only visible posts rendered
```

---

**Version:** 1.0
**Last Updated:** November 10, 2025
**Status:** ✅ Complete
