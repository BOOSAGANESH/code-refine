# CodeMentor AI — Project Documentation

## Overview
A full-featured AI-powered coding preparation platform built as an Expo React Native mobile app with a Node.js/Express backend. Dark theme with electric teal (#00D4FF) accent colors. Custom sliding sidebar navigation.

## Architecture

### Frontend (Expo React Native + expo-router)
- **Navigation**: Custom sliding sidebar overlay (Reanimated) — hamburger menu on every screen
- **State**: React Context + AsyncStorage for persistence; React Query for server state
- **Styling**: StyleSheet with dark theme (Colors.dark.*), Inter font family
- **Entry**: `app/_layout.tsx` → `app/(main)/` group

### Backend (Express + TypeScript, port 5000)
- AI via OpenAI (`AI_INTEGRATIONS_OPENAI_API_KEY`, model `gpt-5.1`)
- Static Expo files served by Express

## Screens (app/(main)/)

| Screen | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Stats, skill radar, quick actions, recent reviews |
| Code Analyzer | `/analyzer` | Paste code → AI review → navigate to /review |
| Review History | `/history` | List of past reviews, swipe to delete |
| DSA Practice | `/practice` | 15 problems by topic, progress tracking, AI hints |
| Quiz | `/quiz` | MCQ with timer, 20 questions, score tracking |
| Interview Sim | `/interview` | AI-powered Q&A with evaluation |
| Career Advisor | `/career` | AI career paths, LinkedIn tips, post generator |
| Roadmap | `/roadmap` | AI 7-day learning plan generator |
| Profile | `/profile` | User setup, skill radar, quiz history |

Also: `app/review.tsx` — Code review result with tabs (overview/bugs/security/optimize)

## Key Components

| Component | Purpose |
|-----------|---------|
| `components/Sidebar.tsx` | Sliding sidebar with Reanimated |
| `components/ScreenHeader.tsx` | Header with hamburger menu button |
| `components/RadarChart.tsx` | SVG skill radar chart |
| `components/ScoreRing.tsx` | Circular score indicator |
| `components/IssueCard.tsx` | Bug/security issue display |
| `components/SuggestionCard.tsx` | Code suggestion display |

## Contexts

| Context | Purpose |
|---------|---------|
| `UserContext` | Profile, login, skills, progress (AsyncStorage) |
| `ReviewHistoryContext` | Code review records (AsyncStorage) |
| `SidebarContext` | Sidebar open/close state |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/review` | AI code analysis |
| GET | `/api/quiz/questions?topic&count` | 20 MCQ questions |
| GET | `/api/problems` | DSA problems list |
| GET | `/api/problems/:id/hint` | AI hint for problem |
| POST | `/api/interview/question` | Generate interview question |
| POST | `/api/interview/evaluate` | Evaluate interview answer |
| POST | `/api/career/advice` | Career paths + LinkedIn tips |
| POST | `/api/roadmap/generate` | 7-day learning roadmap |

## Color Palette
- Background: `#0A0E1A`
- Surface: `#131929`
- Accent (teal): `#00D4FF`
- Green: `#00E676`
- Orange: `#FFA726`
- Red: `#FF4757`

## Key Rules
- NEVER use emojis (use @expo/vector-icons)
- NEVER hardcode top padding (use `useSafeAreaInsets()`)
- Web insets: top Math.max(insets.top, 67), bottom 34px
- useAnimatedStyle MUST be at top level of components, never inside loops/maps
- Use `apiRequest` from `@/lib/query-client` for all API calls
- AI model: `gpt-5.1` for all completions

## Workflows
- **Start Backend**: `npm run server:dev` (port 5000)
- **Start Frontend**: `npm run expo:dev` (port 8081)
