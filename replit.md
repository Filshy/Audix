# Sonora Music Player

## Overview

Sonora is a mobile music player application built with React Native and Expo. It reads audio files from the device's media library, displays them organized by tracks, albums, and artists, and provides full playback controls including shuffle, repeat, seek, and queue management. The app features a dark-themed UI with quality indicators (lossless, high, standard, low) for audio files. It also has a backend Express server that provides metadata enrichment via the MusicBrainz API and serves a landing page for web/deployment contexts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: expo-router with file-based routing. The app has a tab layout (`(tabs)/`) with Library and Search tabs, plus modal screens for the now-playing player (`player/now-playing`) and album details (`album/[id]`)
- **State Management**: React Context (`MusicProvider` in `lib/music-context.tsx`) manages all music state — tracks, albums, artists, playback, queue, shuffle, repeat mode. No Redux or external state library is used
- **Audio Playback**: `expo-av` handles audio playback on-device
- **Media Library Access**: `expo-media-library` scans the device for audio files. A `PermissionGate` component handles permission requests before showing content
- **Styling**: Pure `StyleSheet.create` with a centralized color theme in `constants/colors.ts`. Dark theme throughout (background `#0A0A0F`). Uses `expo-linear-gradient`, `expo-blur`, and `expo-glass-effect` for visual effects
- **Animations**: `react-native-reanimated` for animated transitions and gestures
- **Fonts**: Inter font family via `@expo-google-fonts/inter`
- **Data Fetching**: `@tanstack/react-query` with a configured query client in `lib/query-client.ts`, primarily for server API calls
- **Local Storage**: `@react-native-async-storage/async-storage` for persisting user preferences
- **Demo Mode**: On web or when no media library access, the app shows hardcoded demo tracks defined in `music-context.tsx`

### Backend (Express Server)

- **Framework**: Express 5 running on Node.js, written in TypeScript (`server/index.ts`)
- **Purpose**: Serves as an API server for metadata enrichment and a landing page for web deployment
- **CORS**: Configured to allow Replit dev/deployment domains and localhost origins
- **API Routes** (`server/routes.ts`):
  - MusicBrainz integration for fetching track metadata and album artwork from the Cover Art Archive
  - The server acts as a proxy for metadata lookups, not for audio streaming
- **Storage** (`server/storage.ts`): In-memory storage (`MemStorage`) with a basic user model. Currently uses a Map, not connected to the database. The interface is defined for future database integration
- **Build**: Server is bundled with esbuild for production (`server:build` script)

### Database Schema

- **ORM**: Drizzle ORM configured for PostgreSQL (`drizzle.config.ts`)
- **Schema** (`shared/schema.ts`): Currently minimal — just a `users` table with `id`, `username`, and `password` fields
- **Current State**: The schema exists but the server uses in-memory storage (`MemStorage`). The database is configured via `DATABASE_URL` environment variable but not actively connected in the running application. Database can be provisioned and connected when needed using `db:push`
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from the Drizzle table definitions

### Key Design Decisions

1. **Local-first music player**: All audio scanning, playback, and library management happens on-device. The server is supplementary for metadata only
2. **Context-based state**: A single `MusicContext` holds all playback and library state, avoiding prop drilling across the deep component tree
3. **Platform adaptation**: Components check `Platform.OS` to adjust behavior for iOS, Android, and web. The tab layout has both a native tabs variant (using liquid glass on supported iOS) and a classic fallback
4. **Quality tier system**: Tracks are classified into lossless/high/standard/low quality tiers based on bitrate and format, with color-coded badges throughout the UI

## External Dependencies

- **MusicBrainz API**: Used server-side to look up track metadata (artist, album, year) by recording title and artist name. User-Agent header set to `Sonora/1.0`
- **Cover Art Archive**: Used server-side to fetch album artwork associated with MusicBrainz release IDs
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable. Schema managed by Drizzle Kit. Not actively used yet but infrastructure is in place
- **Expo Services**: Standard Expo build and development infrastructure
- **Device Media Library**: Primary data source — reads audio files directly from the device via `expo-media-library` permissions (`READ_MEDIA_AUDIO` on Android, `NSAppleMusicUsageDescription` on iOS)