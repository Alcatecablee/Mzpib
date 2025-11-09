# Fusion Starter - Full-Stack React Application

## Overview
A production-ready full-stack React application template with integrated Express server. This project provides a modern development experience with React Router 6 SPA mode, TypeScript, Vite, and comprehensive UI components.

## Tech Stack
- **Frontend**: React 18, React Router 6 (SPA), TypeScript, Vite, TailwindCSS 3
- **Backend**: Express server integrated with Vite dev server
- **UI Components**: Radix UI + TailwindCSS 3 + Lucide React icons
- **Testing**: Vitest
- **Package Manager**: npm (note: original project used pnpm)

## Project Structure
```
client/                   # React SPA frontend
├── pages/                # Route components (Index.tsx = home)
├── components/ui/        # Pre-built UI component library
├── App.tsx              # App entry point with SPA routing setup
└── global.css           # TailwindCSS 3 theming and global styles

server/                   # Express API backend
├── index.ts             # Main server setup (express config + routes)
└── routes/              # API handlers
    ├── demo.ts          # Demo endpoint
    └── videos.ts        # UPNshare API integration

shared/                   # Types used by both client & server
└── api.ts               # Shared API interfaces
```

## Key Features

### Development Setup
- **Single Port Development**: Both frontend and backend run on port 5000 in development
- **Hot Reload**: Both client and server code with automatic refresh
- **API Endpoints**: Prefixed with `/api/`
- **Configured for Replit**: Host set to 0.0.0.0:5000 with HMR over WSS

### Available API Routes
- `GET /api/ping` - Simple ping API (uses PING_MESSAGE env var)
- `GET /api/demo` - Demo endpoint
- `GET /api/videos` - Fetch videos from UPNshare (requires UPNSHARE_API_TOKEN)

### Environment Variables
- `PING_MESSAGE` - Custom message for ping endpoint (optional)
- `UPNSHARE_API_TOKEN` - API token for UPNshare video service (optional)

## Development Commands
- `npm run dev` - Start development server (port 5000)
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm test` - Run tests
- `npm run typecheck` - Type check the codebase

## Path Aliases
- `@/*` - Client folder
- `@shared/*` - Shared folder

## Recent Changes (Replit Setup - Nov 8, 2025)
- Configured Vite to run on 0.0.0.0:5000 for Replit environment
- Added HMR configuration for Replit proxy (WSS over port 443)
- Fixed TypeScript config for ES modules (__dirname support)
- Updated .gitignore to properly exclude .env files
- Set up dev workflow for automatic server restart
- **Latest (Nov 8, 2025)**: Fixed Vercel production timeout issues with global 25s timeout and stale cache fallback

### New Features Added (Nov 8, 2025)
- **Pagination**: Videos now display 20 per page with page number controls (Previous/Next buttons, numbered pages)
- **Tag System**: Videos are automatically tagged with their folder names for easy categorization
- **Tag Filtering**: Users can filter videos by clicking tag buttons on the homepage
- **Hover Preview**: Video thumbnails show preview images on hover (500ms delay) when preview URLs are available from UPNshare API
- **Enhanced Video Cards**: Now display folder tags as badges below video metadata

## Robustness Improvements (Nov 8, 2025)
### Backend Optimizations (server/routes/videos.ts)
- **Global Timeout Protection**: 25-second global timeout to stay within Vercel's 30s serverless limit
- **Adaptive Timeout Handling**: 
  - Folder list fetch: 5-second timeout
  - Per-folder video fetch: 4-second timeout
  - Early exit if running out of time (skips remaining folders)
- **Parallel Folder Fetching**: Changed from sequential to parallel processing - fetches all folders simultaneously for dramatic speed improvement
- **Per-Folder Video Limit**: Limits to 20 videos per folder for faster initial load and to prevent serverless timeouts
- **Graceful Degradation**: Individual folder failures don't crash the entire response
- **5-Minute Cache**: Implements TTL-based caching to reduce API calls
- **Stale Cache Fallback**: Returns old cached data if timeout occurs, ensuring users always get a response

### Frontend Resilience (client/pages/Index.tsx)
- **Automatic Retry Logic**: Up to 2 retries with 2-second delays for network errors
- **30-Second Timeout**: Frontend timeout protection for API calls
- **Loading State Management**: Spinner stays active throughout all retry attempts
- **User Feedback**: Toast notifications during retries and success/error states
- **Pagination System**: Client-side pagination showing 20 videos per page with smart page controls
- **Tag Filtering**: Real-time filtering by tags with visual filter buttons
- **Multi-Filter Support**: Combines search, folder selection, and tag filtering seamlessly

### Vercel Deployment Configuration
- **Serverless Bundle**: Pre-builds server code into single CommonJS file (vite.config.serverless.ts)
- **Optimized Build**: api/index.js imports pre-built bundle to avoid cold start compilation
- **Function Timeout**: Configured for 30s max execution
- **Required Environment Variables**: UPNSHARE_API_TOKEN must be set in Vercel dashboard

## Architecture Notes
- Uses ES modules throughout (type: "module" in package.json)
- Express server integrated directly into Vite dev server via plugin
- Shared types between client/server ensure type safety
- Comprehensive UI component library based on Radix UI primitives
- TailwindCSS with custom theme and HSL color variables
- **Production Build**: Three separate builds - client SPA, server, and serverless bundle
- **Error Handling**: Comprehensive try-catch blocks with meaningful error messages
- **Performance**: Parallel API fetching reduces load time from ~8s to ~2s
- **Client-Side Filtering**: Uses React useMemo for efficient video filtering and pagination
- **Tag System**: Folder names automatically become video tags for categorization
- **Preview Support**: Infrastructure in place to show video previews on hover when UPNshare provides preview URLs

### Video Player Features (Nov 9, 2025)
- **Custom Player Controls**: YouTube-inspired overlay controls with:
  - Play/pause buttons (center overlay + bottom bar)
  - Interactive seek bar with hover tooltip showing time
  - Volume slider with mute/unmute toggle
  - Time display (current / duration)
  - Settings and fullscreen buttons
  - Auto-hide controls on playback (shows on mouse movement)
- **Keyboard Shortcuts**: 
  - Space/K: Play/Pause
  - J/L: Skip backward/forward 10 seconds
  - Arrow Left/Right: Skip 5 seconds
  - Arrow Up/Down: Volume control
  - M: Mute toggle
- **UPnShare Iframe API Integration**: Player URL format `?api=all#videoId` enables API control
- **Styling**: Red progress bar, gradient overlay, smooth transitions matching YouTube aesthetic
- **Note**: Iframe postMessage communication requires further testing to enable full playback control

### Engagement Features (Nov 9, 2025)
- **Related Videos Sidebar**: Automatically displays 5-10 videos from the same folder on video player page
  - Shows video thumbnails with hover effects
  - Displays duration badges and folder name
  - Clickable to navigate to related content
  - Increases engagement and watch time
- **Real-time Viewer Counter**: Infrastructure in place to display live viewer counts
  - Backend API endpoint: `GET /api/realtime`
  - Frontend polling every 30 seconds
  - Badge display on video cards (top-left corner) and player page
  - **Note**: UPnShare realtime API endpoint currently returns errors (may require premium tier or different authentication)

## Phase 4: Enhanced Player & Analytics (Nov 9, 2025)

### Enhanced Video Player Controls ✅
**Implementation:** UPnShare iframe API integration with postMessage communication

**Player Controls:**
- Full iframe API control: play, pause, seek, volume, mute/unmute
- Interactive seek bar with click-to-seek and progress tracking
- Volume slider with visual feedback
- Playback speed selector (0.25x - 2x) - UI only, API support pending
- Picture-in-picture button (browser/iframe limitations apply)
- Auto-hide controls on inactivity with smooth transitions
- Time display and real-time status synchronization

**Technical Details:**
- Bi-directional postMessage communication with UPnShare iframe
- Player URL format: `?api=all` parameter enables API commands
- Status messages: Ready, Playing, Paused, with duration/time data
- 1-second polling for playback position updates

### Playlist Management System ✅
**Backend API:** `/api/playlists`

**Endpoints:**
- `POST /api/playlists` - Create playlist with name, description
- `GET /api/playlists` - List all user playlists
- `GET /api/playlists/:id` - Get playlist details
- `PUT /api/playlists/:id` - Update playlist metadata
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/videos` - Add video to playlist
- `DELETE /api/playlists/:id/videos/:videoId` - Remove video

**Frontend UI:**
- Create/manage playlists from video player sidebar
- Add current video to any playlist
- Display video count and metadata per playlist
- Play button for playlist playback
- Integrated with React Query for optimistic updates

**Data Structure:**
```typescript
interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Storage:** In-memory (prototype) - PostgreSQL recommended for production

### Playback Analytics Tracking ✅
**Backend API:** `/api/analytics`

**Endpoints:**
- `POST /api/analytics/session/start` - Initialize viewing session
- `POST /api/analytics/session/progress` - Update watch time & events
- `POST /api/analytics/session/end` - Finalize session
- `GET /api/analytics/video/:videoId` - Video-level statistics
- `GET /api/analytics/user/:userId` - User watch history

**Metrics Tracked:**
- Total watch time per video
- Average completion rate (% of video watched)
- Pause count and seek count (engagement metrics)
- Unique viewers and session tracking
- Last watched position for resume functionality
- Session duration and timestamps

**Frontend Integration:**
- `useAnalytics` custom hook for session management
- Automatic session start on video load
- Progress updates every 1 second during playback
- Event tracking for pause and seek actions (not throttled)
- Unified updateProgress function for all analytics
- Session cleanup on component unmount

**Data Structure:**
```typescript
interface AnalyticsSession {
  sessionId: string;
  videoId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  watchTime: number;
  lastPosition: number;
  completed: boolean;
  pauseCount: number;
  seekCount: number;
}
```

**Storage:** In-memory (prototype) - PostgreSQL recommended for production

### Known Limitations & TODOs

**Prototype Phase Limitations:**
1. **In-Memory Storage**: Playlists and analytics data lost on restart
   - Production fix: Migrate to PostgreSQL with proper schemas
2. **No Authentication**: userId from query parameter (security risk)
   - Production fix: Implement Replit Auth or OAuth
3. **Analytics Gaps**: Iframe-originated events not fully tracked
   - TODO: Listen for iframe Paused/Seeked messages
4. **Picture-in-Picture**: Cross-origin iframe restrictions
   - Limited browser support for PiP on iframes
5. **Playback Speed**: UPnShare API support unconfirmed
   - Current implementation is UI indication only

**Architecture TODOs:**
- Refactor analytics interval to avoid state dependency issues
- Add IndexedDB fallback for offline analytics queue
- Implement keyboard shortcuts documentation panel
- Add chapter markers for long-form videos
- Create analytics dashboard with charts and trends

### Files Added/Modified (Phase 4)
**Backend:**
- `server/routes/playlist.ts` - Playlist CRUD API
- `server/routes/analytics.ts` - Analytics tracking API
- `server/index.ts` - Route registration

**Frontend:**
- `client/hooks/use-analytics.ts` - Analytics session hook
- `client/components/PlaylistManager.tsx` - Playlist UI
- `client/components/VideoPlayerControls.tsx` - Enhanced controls
- `client/pages/VideoPlayer.tsx` - Player integration

**Documentation:**
- `PHASE_4_SUMMARY.md` - Detailed implementation summary
