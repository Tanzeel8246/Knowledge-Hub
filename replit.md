# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### 1. API Server (`artifacts/api-server`)
- Express 5 + Drizzle ORM + PostgreSQL
- JWT authentication
- Routes: `/api/auth`, `/api/quran`, `/api/hadith`, `/api/books`, `/api/notes`, `/api/bookmarks`, `/api/folders`, `/api/learning`, `/api/progress`, `/api/admin`
- Default admin: `admin@islamicresearch.app` / `admin123456`

### 2. Islamic Research & Learning OS — Mobile App (`artifacts/islamic-app`)
Expo React Native app with the following screens:

**Core Features:**
- Login / Register (JWT auth)
- Home dashboard with 10 quick actions
- Quran reader with per-ayah navigation, audio player (18 reciters via everyayah.com), surah download
- Hadith search & browse (multiple collections including Bukhari, Muslim, Tirmidhi, Abu Dawud, Ibn Majah, Muwatta, Darimi)
- Islamic Books library (19+ books including tafsirs, fiqh, seerah, hadith collections)
- Learning Paths with lesson tracking and progress
- Workspace: Notes, Bookmarks, Folders

**Islamic Tools:**
- Prayer Times (`app/prayer-times.tsx`) — Location-based using `adhan` library, 12 calculation methods, countdown to next prayer, Hijri/Gregorian dates
- Tasbih Counter (`app/tasbih.tsx`) — 8 dhikr presets, haptic feedback, session stats, AsyncStorage persistence
- Qibla Direction (`app/qibla.tsx`) — Live compass using expo-sensors + expo-location, animated needle, Kaaba icon, distance display
- Duas Collection (`app/duas.tsx`) — 20 duas in 8 categories, search, copy to clipboard, expand/collapse
- 99 Names of Allah (`app/names-of-allah.tsx`) — All 99 Asma al-Husna with Arabic, transliteration, meaning, description; searchable grid; detail modal with navigation
- Quran Full-Text Search (`app/quran-search.tsx`) — English/Arabic search via API, popular search terms, results with ayah context
- Qaris Library (`app/qaris.tsx`) — 18 reciters with audio folder info
- Islamic Calendar (`app/islamic-calendar.tsx`) — Hijri/Gregorian calendar using Kuwaiti algorithm, 15 Islamic events with dates, upcoming events list, month navigation
- Zakat Calculator (`app/zakat-calculator.tsx`) — Full asset/liability input, Nisab calculation (gold/silver basis), 2.5% zakat due result with disclaimer
- Prayer Tracker (`app/prayer-tracker.tsx`) — Daily 5-prayer completion logging with AsyncStorage, weekly overview, streak counter, date navigation
- Islamic Quiz (`app/islamic-quiz.tsx`) — 25 Q&A across 6 categories (Quran, Five Pillars, Prophets, History, Fiqh, Arabic), score tracking, explanations, results screen

- Adhkar (`app/adhkar.tsx`) — Morning (8 adhkar) and Evening (8 adhkar) remembrances with per-dhikr tap counter, progress tracking, expand for transliteration/translation/virtue, haptic feedback
- Settings (`app/settings.tsx`) — Prayer calculation method (10 methods), Asr juristic method, Quran display options, notification settings, font size, language, theme mode, about section
- Hifz Tracker (`app/hifz-tracker.tsx`) — All 114 surahs with memorization status (not started/in progress/memorized/revision), ayah-level progress, group by Juz, search/filter, overall progress bar (6,236 ayahs), persistent via AsyncStorage
- Ramadan Tracker (`app/ramadan-tracker.tsx`) — Hijri-based countdown to Ramadan, 30-day fasting log (fasted/missed/partial/exempt), Suhoor/Iftar tracking, daily Quran pages, personal notes, 4 goal checkboxes, stats grid

**Home Screen Features:**
- Hijri date banner (clickable → Islamic Calendar)
- Daily Verse widget (rotates daily, 14 curated Quran ayahs)
- Hadith of the Day widget (rotates daily, 14 curated hadiths)
- Stats row (streak, minutes, lessons)
- 19 quick-action tiles (Read Quran, Hadith, Books, Learn, Prayer Times, Tasbih, Qibla, Duas, 99 Names, Search Quran, Calendar, Workspace, Zakat, Prayer Log, Islamic Quiz, Adhkar, Hifz Tracker, Ramadan)
- Daily Tools row (Prayer Times, Tasbih, Qibla)
- Recent Activity list

**Third-party packages installed:**
- `adhan` — prayer time calculations
- `expo-sensors` — magnetometer for Qibla compass
- `expo-location` — GPS for prayer times and Qibla
- `expo-clipboard` — copy duas/names
- `expo-haptics` — tasbih counter feedback
- `@react-native-async-storage/async-storage` — local persistence

**Audio:**
- URL pattern: `https://everyayah.com/data/{folder}/{surah_padded}{ayah_padded}.mp3`
- Surah download: `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/{surah_padded}.mp3`

### 3. Admin Dashboard (`artifacts/admin-dashboard`)
React + Vite admin panel at `/admin/`
- Users, Books, Learning Paths management
- Stats dashboard

### 4. API Client React (`lib/api-client-react`)
Orval-generated React Query hooks from OpenAPI spec.
- All mutations use `{ data: { ... } }` wrapper format (Orval convention)
- `useSearchQuran({ q })` takes SearchQuranParams
- `useCreateBookmark({ data: { sourceType, sourceId, label } })`

## Important Notes
- **Icon library**: Mobile app uses `MaterialCommunityIcons` from `@expo/vector-icons`. Use valid MCIcon names (e.g. `magnify` not `search`, `star-crescent` not `star-and-crescent`)
- **Seed trigger**: `allBooks.length < 15` triggers extended book seed (17 new books added)
- **Hadith bookmark**: sourceType should be `"hadith" as any` (enum mismatch)
- **Books search**: `useGetBooks` params are `{ category, language, limit }` — no `search` field. Use `useSearchBooks` for text search.
- **BookCategory.id**: string type (not number)
