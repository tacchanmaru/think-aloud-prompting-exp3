# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Run linter:**
```bash
npm run lint
```

**Start production server:**
```bash
npm run start
```

## Project Architecture

This is a Next.js 14 application with App Router architecture that implements a psychological experiment system for text modification tasks. The application supports two experiment types: manual editing and think-aloud protocols.

### Core Architecture Components

**App Structure:**
- Uses Next.js App Router with TypeScript
- PWA-enabled with service worker configuration
- Firebase integration for data persistence
- OpenAI API integration for AI-powered text modifications

**Key Directories:**
- `app/` - Next.js App Router pages and API routes
- `lib/` - Shared utilities and services
- `types/` - TypeScript type definitions
- `app/contexts/` - React Context providers for global state

### Context Providers

**AuthContext** (`app/contexts/AuthContext.tsx`):
- Manages user authentication with userId (1-100 range)
- Provides authentication state across the application
- Handles user ID persistence in localStorage

**TimerContext** (`app/contexts/TimerContext.tsx`):
- Manages experiment timing functionality
- Tracks start/end times for experiment sessions

### Experiment System

**Two Experiment Types:**
1. **Manual Editing** (`app/manual-edit/page.tsx`): Users manually edit product descriptions
2. **Think-Aloud** (`app/think-aloud/page.tsx`): Users verbalize thoughts while AI assists with modifications

**Product Assignment:**
- Products are assigned to users based on userId hash to ensure balanced distribution
- Currently supports product1 and product2 (defined in `lib/products.ts`)

**Data Flow:**
1. User selects experiment type from homepage
2. Product is assigned based on user ID
3. Experiment data is tracked through timer context
4. Results are saved via `/api/save-experiment` endpoint
5. Data is persisted to Firebase

### API Routes

**Key Endpoints:**
- `/api/save-experiment` - Saves experiment results to Firebase
- `/api/transcribe` - Handles audio transcription
- `/api/text-modification` - Processes AI-powered text modifications
- `/api/history-summary` - Generates conversation history summaries
- `/api/auth/openai-token` - Manages OpenAI API authentication

### Firebase Integration

**Configuration:**
- Firebase project setup in `lib/firebase/`
- Firestore for data persistence
- Firebase hosting configuration in `firebase.json`

**Data Structure:**
- Experiment results conform to `ExperimentResult` interface
- Includes timing data, user actions, and intermediate steps for think-aloud experiments

### Key Features

**PWA Support:**
- Service worker configuration in `next.config.mjs`
- Offline functionality and caching strategies
- Mobile-responsive design

**Audio Processing:**
- Web Speech API integration for voice transcription
- Audio processor for real-time speech recognition
- WebRTC type definitions in `types/webrtc.d.ts`

**User Experience:**
- Practice mode available for both experiment types
- Settings modal for user configuration
- Mobile-optimized interface with responsive design

### TypeScript Configuration

**Import Paths:**
- `@/*` maps to project root for clean imports
- Strict TypeScript configuration enabled
- Custom type definitions in `types/` directory

### Important Notes

- User IDs must be between 1-100 for experiment participation
- Practice mode doesn't save data to Firebase
- Application is designed for research purposes with specific experimental protocols
- Text modifications use OpenAI API with structured prompts