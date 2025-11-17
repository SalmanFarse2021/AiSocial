# Following System - Visual Component Guide

## Component Breakdown

### 1. Follow Button States

#### Not Following (Primary State)
```
┌─────────────────┐
│  Follow  👍      │  Sky Blue (#0ea5e9)
└─────────────────┘
Text: White
Hover: Darker blue (#0284c7)
Animation: Smooth color transition
```

**CSS:**
```css
bg-sky-600 hover:bg-sky-700
text-white font-medium
px-3 py-1 rounded text-xs
transition-all
```

#### Following (Secondary State)
```
┌─────────────────┐
│ Following ✓     │  Gray (#1f2937) with border
└─────────────────┘
Text: White
Border: White/20 opacity
Hover: Darker gray (#111827)
```

**CSS:**
```css
bg-gray-800 hover:bg-gray-700
border border-white/20
text-white font-medium
px-3 py-1 rounded text-xs
transition-all
```

---

### 2. Post Header with Follow Button

```
┌─────────────────────────────────────────────────────┐
│  ⭕ Username          Follow                         │
│     now 🌍                                           │
│                                                     │
│ Lorem ipsum dolor sit amet...                       │
│                                                     │
│ [Image/Video Preview]                               │
│                                                     │
│  👍 React    💬 Comment    ↪️  Share                │
└─────────────────────────────────────────────────────┘
```

**Layout:**
- Avatar: 40x40px circle
- Name: Bold, left-aligned
- Follow button: Top-right, compact size
- Time & privacy: Smaller text below username
- Content below
- Action buttons at bottom

---

### 3. Discover Page Layout

#### Desktop (3 columns)
```
┌──────────────────────────────────────────────────────────┐
│  Discover - Find & Follow New Users                      │
├──────────────────────────────────────────────────────────┤
│
│  ┌─────────┐    ┌─────────┐    ┌─────────┐
│  │  ⭕     │    │  ⭕     │    │  ⭕     │
│  │ User1   │    │ User2   │    │ User3   │
│  │ @user1  │    │ @user2  │    │ @user3  │
│  │ Bio...  │    │ Bio...  │    │ Bio...  │
│  │ 100 👥 │    │ 200 👥 │    │ 150 👥 │
│  │ [Follow]│    │[Following] │ [Follow]│
│  │View →  │    │View →  │    │View →  │
│  └─────────┘    └─────────┘    └─────────┘
│
│  ┌─────────┐    ┌─────────┐    ┌─────────┐
│  │  ⭕     │    │  ⭕     │    │  ⭕     │
│  │ User4   │    │ User5   │    │ User6   │
│  │ @user4  │    │ @user5  │    │ @user6  │
│  │ Bio...  │    │ Bio...  │    │ Bio...  │
│  │ 80 👥  │    │ 300 👥 │    │ 120 👥 │
│  │ [Follow]│    │ [Follow]│    │[Following] │
│  │View →  │    │View →  │    │View →  │
│  └─────────┘    └─────────┘    └─────────┘
│
└──────────────────────────────────────────────────────────┘
```

#### Mobile (1 column)
```
┌──────────────────────────┐
│  Discover                │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │  ⭕                  │ │
│ │ Username             │ │
│ │ @username            │ │
│ │ Bio preview text     │ │
│ │ 100 Followers        │ │
│ │ [Follow]             │ │
│ │ View Profile         │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │  ⭕                  │ │
│ │ Username             │ │
│ │ @username            │ │
│ │ Bio preview text     │ │
│ │ 200 Followers        │ │
│ │ [Following]          │ │
│ │ View Profile         │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Card Styling:**
- Background: `bg-gray-800`
- Border: `border border-white/10`
- Text Center: All text centered
- Avatar Size: 64x64px
- Padding: `p-6`
- Hover: Border becomes `white/20`

---

### 4. Following/Followers Page Layout

#### Tab Bar
```
┌──────────────────────────────────────────────────┐
│ Following (50)  |  Followers (150)  |  Suggested │
│ ═════════════════                               │
└──────────────────────────────────────────────────┘
```

**Tab Styling:**
- Active: Sky blue underline `border-b-2 border-sky-600`
- Inactive: Gray text `text-white/60`
- Shows count in parentheses
- Horizontal scroll on mobile

#### Following List Item
```
┌───────────────────────────────────────────────────┐
│ ⭕  Username              [Following]             │
│     @username                                    │
│     Bio preview text...                         │
└───────────────────────────────────────────────────┘
```

**Item Layout:**
- Avatar: 48x48px left
- Name: Bold, primary text
- Username: Gray text below
- Bio: Smaller, truncated to 1 line
- Button: Right-aligned, compact
- Padding: `p-4`
- Border: Bottom border between items

---

### 5. User Profile Card in List

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ⭕ john_doe           [Follow] [Message] [•••]  │
│     John Doe                                    │
│     Software Developer from SF                 │
│                                                  │
│  100 Posts  | 500 Followers | 300 Following    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Profile Card:**
- Horizontal layout on desktop
- Vertical on mobile
- Avatar: 40-60px
- Name in bold
- Subtitle: Bio/location
- Stats below
- Buttons right-aligned

---

### 6. Profile Page Stats Widget

#### Desktop Layout
```
┌────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│ │  150     │  │  300     │  │ 📊       │ │
│ │Followers │  │Following │  │View Prof │ │
│ └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────────────────────┘
```

**Stats Grid:**
- 3 columns on desktop
- Full width cards
- Large numbers (font-size: 2xl)
- Labels below (smaller text)
- Gray background: `bg-gray-800`
- Border: `border border-white/10`
- Hover: `hover:border-white/20`

---

### 7. Sidebar Navigation

```
┌────────────────────┐
│ AiSocial 🚀        │
├────────────────────┤
│ 🏠 Home            │
│ 📤 Feed            │
│ 🔍 Search          │
│ ❤️ Discover        │ ← NEW
│ 🔔 Following       │ ← NEW
│ 🎬 Reels           │
│ 💬 Messages        │
│ 🔔 Notifications   │
│ ✨ Create          │
│ 👤 Profile         │
├────────────────────┤
│ © 2025 AiSocial    │
└────────────────────┘
```

**Nav Items:**
- Each item: `flex items-center gap-3 px-3 py-2`
- Hover: `bg-white/10`
- Icon: 24x24
- Text: Small, bold
- Rounded corners: `rounded-lg`

---

### 8. User Card Variations

#### Grid Card (Discover)
```
┌─────────────────┐
│       ⭕        │
│    64x64 px     │
├─────────────────┤
│    Username     │
│   @username     │
│                 │
│ This is their   │
│ bio preview     │
│                 │
│ 💯 100  👥 50  │
│                 │
│  [Follow Btn]   │
│ View Profile    │
└─────────────────┘
```

**Grid Styling:**
- Center aligned
- Avatar prominent
- Text centered
- Stats inline
- Button full-width
- Padding: `p-6`

#### List Item (Following)
```
⭕ Username        [Follow]
   @username
   Bio text...
```

**List Styling:**
- Left avatar
- Horizontal layout
- Right-aligned button
- Compact vertical spacing
- Padding: `p-4`

---

### 9. Empty States

#### No Followers
```
┌──────────────────────────────────────┐
│                                      │
│      No followers yet 😔            │
│                                      │
│  Share your profile to get          │
│  followers!                          │
│                                      │
└──────────────────────────────────────┘
```

#### No Following
```
┌──────────────────────────────────────┐
│                                      │
│  You're not following anyone yet    │
│                                      │
│  Start following users to see       │
│  their posts! 🌟                     │
│                                      │
└──────────────────────────────────────┘
```

**Empty State Styling:**
- Center aligned
- Large text: `text-center py-12`
- Emoji/icon
- Helpful message
- Secondary text: `text-white/60`
- Background: `bg-gray-800/30`
- Border: `border border-white/10`
- Full width container

---

### 10. Loading States

#### Skeleton Loader
```
┌─────────────────────────────┐
│ ⭕▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ▓▓▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓▓▓▓▓  │
│ ▓▓▓▓▓  ▓▓▓▓▓ ▓▓▓▓▓▓   │
│                          │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                          │
│ ⭕▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ▓▓▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓▓▓▓▓  │
└─────────────────────────────┘
```

#### Simple Spinner
```
┌──────────────────────┐
│      Loading...      │
│                      │
│      ⟳ Loading...    │
│                      │
└──────────────────────┘
```

---

### 11. Button Sizes

#### Compact (Post Header)
```
[Follow] - text-xs px-3 py-1
```

#### Standard (List Items)
```
[Follow Button] - px-4 py-2
```

#### Full Width (Grid Cards)
```
┌───────────────────┐
│  [Follow Button]  │
└───────────────────┘
```

---

### 12. Color Reference

#### Primary Colors
```
Sky Blue:     #0ea5e9  (bg-sky-600)
Hover Sky:    #0284c7  (bg-sky-700)

Gray Primary: #1f2937  (bg-gray-800)
Hover Gray:   #111827  (bg-gray-700)
```

#### Text Colors
```
Primary:      #ffffff  (text-white)
Secondary:    rgba(255,255,255,0.6)  (text-white/60)
Tertiary:     rgba(255,255,255,0.4)  (text-white/40)
```

#### Borders
```
Base:    rgba(255,255,255,0.1)  (border-white/10)
Hover:   rgba(255,255,255,0.2)  (border-white/20)
```

---

### 13. Responsive Breakpoints

#### Mobile (<640px)
- Single column
- Full-width cards
- Larger touch targets
- Stacked buttons

#### Tablet (640px - 1024px)
- Two columns for grids
- Sidebar collapses
- Optimized padding

#### Desktop (>1024px)
- Three columns for grids
- Sidebar visible
- Normal padding

---

### 14. Animation States

#### Button Click
1. User clicks Follow button
2. Button color changes (0.2s transition)
3. Text updates
4. Background changes smoothly
5. State syncs with API

```css
transition: all 0.2s ease-in-out;
```

#### Hover Effects
```css
/* Follow Button */
hover:bg-sky-700

/* Following Button */
hover:bg-gray-700

/* Card */
hover:border-white/20

/* Navigation */
hover:bg-white/10
```

---

### 15. Accessibility Features

- ✅ High contrast colors (WCAG AAA)
- ✅ Clear button labels
- ✅ Keyboard navigation
- ✅ Focus states visible
- ✅ Screen reader friendly
- ✅ Loading states announced

**Focus State:**
```css
:focus {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
```

---

## Component Code Examples

### Follow Button Component
```jsx
<button
  onClick={handleFollow}
  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
    isFollowing
      ? 'bg-gray-800 text-white border border-white/20 hover:bg-gray-700'
      : 'bg-sky-600 text-white hover:bg-sky-700'
  }`}
>
  {isFollowing ? 'Following' : 'Follow'}
</button>
```

### User Card Component
```jsx
<div className="bg-gray-800 rounded-lg border border-white/10 p-4 hover:border-white/20">
  <Link href={`/u/${user.username}`}>
    <Avatar>{user.username[0]}</Avatar>
    <h3 className="font-bold text-white">{user.displayName}</h3>
    <p className="text-white/60">@{user.username}</p>
  </Link>
  <FollowButton user={user} onFollow={handleFollow} />
</div>
```

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
