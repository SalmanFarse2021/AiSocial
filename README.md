# 🚀 AiSocial - AI-Powered Social Platform

A cutting-edge social media platform that seamlessly integrates advanced artificial intelligence to deliver intelligent image analysis, dynamic content generation, and personalized user experiences.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [AI Features](#ai-features)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

**AiSocial** is a full-stack social media platform built with modern web technologies and powered by AI. It enables users to share posts, connect with others, and leverage AI-driven tools for enhanced content creation and analysis.

### Vision
To democratize AI-powered content creation by integrating state-of-the-art generative AI capabilities into an intuitive, user-friendly social platform.

### Core Mission
Provide users with intelligent tools to:
- Generate compelling captions for images
- Analyze visual content for insights
- Create relevant hashtags automatically
- Modify images with AI-powered prompts
- Connect and collaborate with other users in real-time

---

## ✨ Key Features

### 🎨 AI-Powered Tools
1. **Caption Generation** (Gemini Vision API)
   - Generate multiple caption styles: short, long, funny, emotional
   - Context-aware and image-specific suggestions
   - One-click selection and post integration

2. **Image Analysis** (Gemini Vision API)
   - Automatic content analysis and descriptions
   - Quality assessment
   - Object and scene recognition

3. **Hashtag Generation** (Gemini Vision API)
   - Generate 15+ relevant hashtags
   - Mix of popular and niche tags
   - SEO-optimized suggestions

4. **Image Generation** (DeepAI API)
   - Text-to-image generation
   - Creative and original image creation
   - Prompt-based customization

5. **Image Modification** (LightX API)
   - AI-powered image transformation
   - Edit with custom prompts
   - Non-destructive modifications

### 👥 Social Features
- **User Profiles** - Customizable bios, profile pictures, and user information
- **Feed System** - Real-time feed with infinite scroll
- **Messaging** - Direct messaging with message persistence
- **Stories** - Ephemeral content sharing with reactions
- **Like & Comment** - Engagement features with real-time updates
- **Follow System** - Build networks and discover users
- **Notifications** - Real-time notification system
- **Media Upload** - Support for images and videos

### 🔐 Security & Performance
- JWT-based authentication
- Secure password hashing (bcrypt)
- CORS protection
- Rate limiting
- Cloud storage integration (Cloudinary)
- Optimized image delivery
- Database indexing for fast queries

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Custom API wrapper with fetch
- **Image Handling**: Next.js Image component
- **Real-time**: WebSocket integration for messaging

### Backend
- **Runtime**: Node.js (Cloudinary SDK for media optimization)
- **Framework**: Express.js
- **Language**: JavaScript/TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Password Security**: bcrypt
- **API Documentation**: RESTful endpoints

### AI/ML Services
- **Gemini Vision API** - Image captioning, analysis, hashtag generation
- **DeepAI API** - Text-to-image generation
- **LightX API** - Advanced image editing and transformation

### DevOps & Hosting
- **Version Control**: Git & GitHub
- **Package Manager**: npm
- **Build Tools**: Next.js build system
- **Environment Management**: .env files for secrets
- **Cloud Storage**: Cloudinary for media management

---

## 📁 Project Structure

```
AiSocial/
├── client/                              # Next.js Frontend
│   ├── src/
│   │   ├── app/                        # App Router pages
│   │   │   ├── home/                   # Main feed and composer
│   │   │   ├── login/                  # Authentication
│   │   │   ├── messages/               # Direct messaging
│   │   │   ├── notifications/          # Notifications page
│   │   │   ├── u/[username]/           # User profiles
│   │   │   ├── layout.js               # Root layout
│   │   │   ├── page.js                 # Landing page
│   │   │   └── globals.css             # Global styles
│   │   ├── components/                 # React components
│   │   │   ├── AI/                     # AI feature components
│   │   │   │   ├── CaptionGenerator.tsx
│   │   │   │   ├── ImageEnhancer.jsx
│   │   │   │   └── ImageTransformer.jsx
│   │   │   ├── Messenger.jsx           # Chat interface
│   │   │   ├── Navbar.jsx              # Navigation
│   │   │   ├── MessageActions.jsx      # Message options
│   │   │   ├── IncomingCall.jsx        # Call notifications
│   │   │   └── ...other components
│   │   ├── lib/                        # Utility functions
│   │   │   ├── api.ts                  # API wrapper
│   │   │   ├── upload.ts               # File upload logic
│   │   │   ├── media.ts                # Media utilities
│   │   │   └── ...other utilities
│   │   └── services/                   # API service modules
│   │       └── aiService.ts            # AI API client
│   ├── public/                         # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── .eslintrc.json
│
├── server/                              # Express.js Backend
│   ├── src/
│   │   ├── controllers/                # Business logic
│   │   │   ├── aiController.js         # AI feature endpoints
│   │   │   ├── post.controller.js      # Post CRUD operations
│   │   │   ├── user.controller.js      # User management
│   │   │   ├── message.controller.js   # Messaging logic
│   │   │   ├── notification.controller.js
│   │   │   ├── stats.controller.js     # Analytics
│   │   │   └── ...other controllers
│   │   ├── routes/                     # API routes
│   │   │   ├── aiRoutes.js             # /api/ai endpoints
│   │   │   ├── post.routes.js          # /api/posts
│   │   │   ├── user.routes.js          # /api/users
│   │   │   ├── auth.routes.js          # /api/auth
│   │   │   ├── message.routes.js       # /api/messages
│   │   │   ├── notification.routes.js  # /api/notifications
│   │   │   └── ...other routes
│   │   ├── models/                     # Database schemas
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   ├── Message.js
│   │   │   ├── Comment.js
│   │   │   ├── Notification.js
│   │   │   └── ...other models
│   │   ├── middleware/                 # Express middleware
│   │   │   ├── auth.js                 # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   └── ...other middleware
│   │   ├── utils/                      # Helper functions
│   │   │   ├── geminiClient.js         # Gemini integration
│   │   │   ├── validators.js
│   │   │   └── ...utilities
│   │   └── index.js                    # Express app setup
│   ├── package.json
│   └── .env.example
│
├── README.md                            # This file
└── .gitignore

```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- API Keys for:
  - Google Cloud (Gemini API)
  - DeepAI
  - LightX
  - Cloudinary

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_KEY=your_cloudinary_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   GEMINI_API_KEY=your_gemini_api_key
   DEEPAI_API_KEY=your_deepai_api_key
   LIGHTX_API_KEY=your_lightx_api_key
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local` file** with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Application runs on `http://localhost:3000`

---

## 📡 API Documentation

### AI Endpoints

#### Generate Caption
```
POST /api/ai/generate-caption
Headers: Authorization: Bearer {token}
Body: { imageUrl: string }
Response: { success: boolean, captions: { shortCaption, longCaption, funnyCaption, emotionalCaption, hashtags } }
```

#### Analyze Image
```
POST /api/ai/analyze-image
Headers: Authorization: Bearer {token}
Body: { imageUrl: string }
Response: { success: boolean, analysis: string }
```

#### Generate Hashtags
```
POST /api/ai/generate-hashtags
Headers: Authorization: Bearer {token}
Body: { imageUrl: string }
Response: { success: boolean, hashtags: string[] }
```

#### Generate Image
```
POST /api/ai/generate-image
Headers: Authorization: Bearer {token}
Body: { prompt: string }
Response: { success: boolean, imageUrl: string, prompt: string }
```

#### Modify Image
```
POST /api/ai/modify-image
Headers: Authorization: Bearer {token}
Body: { imageUrl: string, prompt: string }
Response: { success: boolean, modifiedImageUrl: string }
```

### Post Endpoints
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/unlike` - Unlike post

### User Endpoints
- `GET /api/users/me` - Get current user
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/follow` - Follow user
- `POST /api/users/:id/unfollow` - Unfollow user

### Message Endpoints
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout

---

## 🤖 AI Features

### 1. Caption Generation
Powered by **Gemini Vision API**, generates multiple caption styles:
- **Short Caption**: 4-8 word descriptions
- **Long Caption**: 1-2 sentence creative captions
- **Funny Caption**: Humorous and witty takes
- **Emotional Caption**: Deep, thoughtful descriptions
- **Hashtags**: 15+ relevant hashtags

**Use Case**: Content creators can quickly generate engaging captions without manual writing.

### 2. Image Analysis
Analyzes images for:
- Object recognition
- Scene understanding
- Quality assessment
- Mood detection
- Content relevance

**Use Case**: Get insights about uploaded images before posting.

### 3. Image Generation
Creates original images from text prompts using **DeepAI API**.

**Use Case**: Users can generate creative visuals for their posts without design skills.

### 4. Image Modification
Edit images with AI-powered prompts using **LightX API**.

**Use Case**: Enhance, transform, or modify images with natural language instructions.

---

## 🔐 Authentication

### Authentication Flow
1. User signs up or logs in
2. Server verifies credentials and generates JWT token
3. Token stored in localStorage on client
4. Token sent in Authorization header for protected routes
5. Server validates token middleware before processing requests

### Security Features
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- CORS protection
- Rate limiting on auth endpoints
- Secure HTTP-only cookies for tokens
- OAuth 2.0 integration with Google

---

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  profilePic: String,
  bio: String,
  followers: [ObjectId],
  following: [ObjectId],
  posts: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Post Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  caption: String,
  media: [{ url: String, type: String }],
  likes: [ObjectId],
  comments: [ObjectId],
  shares: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  content: String,
  media: String,
  read: Boolean,
  createdAt: Date
}
```

---

## 🎯 Performance Optimizations

1. **Image Optimization**
   - Cloudinary CDN for image delivery
   - Automatic format conversion
   - Responsive image sizing

2. **Database Optimization**
   - Indexed queries for fast lookups
   - Pagination for feed loading
   - Connection pooling

3. **Frontend Optimization**
   - Code splitting with Next.js
   - Image lazy loading
   - CSS minimization
   - Client-side caching

4. **API Optimization**
   - Response compression
   - Caching strategies
   - Efficient database queries

---

## 🔄 Real-Time Features

### WebSocket Implementation
- Direct messaging with real-time delivery
- Online status indicators
- Typing indicators
- Message read receipts

### Socket.IO Events
- `message:send` - Send message
- `message:read` - Mark as read
- `user:online` - User goes online
- `user:offline` - User goes offline
- `typing` - User typing

---

## 🧪 Testing

### Backend Testing
```bash
cd server
npm run test
```

### Frontend Testing
```bash
cd client
npm run test
```

---

## 📦 Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Railway/Render)
```bash
git push heroku main
```

### Environment Variables
Ensure all `.env` variables are set in deployment platform.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Salman Farse**
- GitHub: [@SalmanFarse2021](https://github.com/SalmanFarse2021)
- Email: contact@example.com

---

## 🙏 Acknowledgments

- **Google Gemini** for vision AI capabilities
- **DeepAI** for image generation
- **LightX** for image editing
- **Cloudinary** for media management
- **MongoDB** for reliable database
- **Next.js** for modern frontend framework
- **Express.js** for robust backend

---

## 📞 Support

For issues, feature requests, or questions:
1. Open an issue on GitHub
2. Email: support@aisocial.com
3. Join our Discord community

---

## 🚀 Roadmap

- [ ] Video support and streaming
- [ ] Advanced analytics dashboard
- [ ] AI-powered content recommendations
- [ ] Live streaming feature
- [ ] Mobile app (React Native)
- [ ] Blockchain integration for NFTs
- [ ] Improved search and discovery
- [ ] Content moderation AI
- [ ] Multi-language support
- [ ] Premium subscription model

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
