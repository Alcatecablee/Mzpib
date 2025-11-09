# Fusion Starter - Full-Stack React Application

## Overview
Fusion Starter is a production-ready, full-stack React application template designed for a modern development experience. It features React Router 6 in SPA mode, TypeScript, Vite, TailwindCSS, and an integrated Express server. The project aims to provide a robust foundation for building interactive web applications, focusing on video content management, playback, and user engagement, with a strong emphasis on performance, scalability, and an enhanced user experience. Key capabilities include comprehensive video management with upload, tagging, and filtering, an advanced video player with custom controls and analytics, and a playlist management system.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application is structured into three main parts: `client` (React SPA frontend), `server` (Express API backend), and `shared` (TypeScript types).

**UI/UX Decisions:**
- **Component Library**: Utilizes Radix UI primitives for headless components, styled with TailwindCSS 3.
- **Theming**: TailwindCSS 3 with custom theming and HSL color variables for a modern aesthetic.
- **Video Playback**: YouTube-inspired overlay controls with a red progress bar, gradient overlay, and smooth transitions.
- **Engagement Features**: Related videos sidebar, real-time viewer counter, and intuitive playlist management UI.
- **Upload Interface**: Drag-and-drop with visual feedback, multi-file queue, and real-time progress.

**Technical Implementations:**
- **Frontend**: React 18, React Router 6 (SPA), TypeScript, Vite, TailwindCSS 3, Lucide React icons.
- **Backend**: Express server integrated with Vite dev server, TypeScript, ES modules.
- **API Communication**: Shared types between client/server ensure type safety.
- **Development Setup**: Single port development (5000), hot reload for both client and server, API endpoints prefixed with `/api/`.
- **Performance Optimizations**:
    - **Backend**: Global and adaptive timeouts, parallel folder fetching, per-folder video limits, graceful degradation for individual folder failures, 5-minute TTL caching with stale cache fallback.
    - **Frontend**: Automatic retry logic for network errors, 30-second API call timeout, loading state management, client-side pagination, `useMemo` for efficient filtering.
- **Video Player**: UPnShare Iframe API integration with `postMessage` for full control (play, pause, seek, volume, speed, PiP), keyboard shortcuts.
- **Playlist Management**: CRUD operations for playlists via REST API, integrated with React Query for optimistic updates.
- **Analytics Tracking**: Tracks total watch time, completion rate, pause/seek counts, unique viewers, and last watched position. Implemented with a `useAnalytics` hook for session management.
- **Video Upload**: TUS protocol resumable uploads via `tus-js-client` with features like drag-and-drop, multi-file queue, progress tracking, pause/resume, retries, and folder selection. Supports max 20GB files and common video formats.
- **Production Build**: Separate builds for client SPA, server, and serverless bundle for Vercel deployment. Serverless bundle pre-builds server code into a single CommonJS file for optimized cold starts.
- **Error Handling**: Comprehensive try-catch blocks and meaningful error messages across the application.

**Feature Specifications:**
- **Video Display**: 20 videos per page with pagination, automatic tag generation from folder names, tag filtering, and hover preview for thumbnails.
- **API Routes**: `/api/ping`, `/api/demo`, `/api/videos` (UPNshare integration), `/api/playlists` (CRUD), `/api/analytics` (tracking), `/api/upload/credentials` (TUS upload).
- **Environment Variables**: `PING_MESSAGE`, `UPNSHARE_API_TOKEN`.
- **Path Aliases**: `@/*` for client, `@shared/*` for shared.
- **Database**: PostgreSQL for playlists and analytics data storage, with proper schemas and indexing.

## External Dependencies
- **Frontend Framework**: React 18
- **Routing**: React Router 6
- **Build Tool**: Vite
- **Styling**: TailwindCSS 3
- **UI Primitives**: Radix UI
- **Icons**: Lucide React
- **Backend Framework**: Express
- **Testing**: Vitest
- **Package Manager**: npm (originally pnpm)
- **Video Service API**: UPNshare (for video fetching, previews, and upload via TUS protocol)
- **Database**: PostgreSQL
- **Upload Library**: `tus-js-client` (for resumable uploads)