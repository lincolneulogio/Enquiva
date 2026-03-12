# FaithEvents — Community Event Management Platform

A production-ready, full-stack web platform for managing community and faith-based events. Built with the modern Next.js 15 App Router stack.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router + Server Actions) |
| Language | TypeScript (strict) |
| Database ORM | Drizzle ORM + PostgreSQL (Neon) |
| Authentication | Better Auth |
| AI Features | Vercel AI SDK + OpenAI |
| File Uploads | UploadThing |
| Realtime | Pusher |
| Validation | Zod |
| Caching | Redis (Upstash) |
| Styling | Tailwind CSS |

## Features

- **3 User Roles**: Super Admin, Organizer, Member
- **Event Management**: Full CRUD with draft/publish workflow
- **AI Description Generator**: Streaming AI-powered event descriptions
- **Real-Time Updates**: Live attendee counts and check-in feed via Pusher
- **Registration System**: With waitlist management and QR codes
- **Notification Center**: Real-time in-app notifications
- **Redis Caching**: Event listings cached for performance
- **Rate Limiting**: Prevent registration spam with Upstash

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in all required values
```

### 3. Set up the database

```bash
npm run db:push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # Admin, Organizer, Member dashboards
│   ├── events/           # Public event listing and detail pages
│   └── api/              # API routes (auth, uploadthing, pusher, AI)
├── components/
│   ├── auth/             # Login/Register forms
│   ├── events/           # EventCard, EventForm, RegisterButton, etc.
│   ├── dashboard/        # Sidebar, Topbar, Charts
│   └── shared/           # Reusable UI components
├── lib/
│   ├── db/               # Drizzle schema + client
│   ├── auth/             # Better Auth config + client
│   ├── redis/            # Upstash Redis + caching utilities
│   ├── pusher/           # Server + client Pusher config
│   ├── uploadthing/      # File router + components
│   ├── ai/               # AI SDK helpers
│   └── validations/      # All Zod schemas
├── actions/              # Next.js Server Actions
├── hooks/                # Custom React hooks
├── env.ts                # Typed environment variables
└── middleware.ts          # Route protection
```

## Services to Configure

| Service | Purpose | URL |
|---------|---------|-----|
| Neon | PostgreSQL database | neon.tech |
| Better Auth | Authentication | better-auth.com |
| Pusher | Real-time events | pusher.com |
| UploadThing | File uploads | uploadthing.com |
| Upstash | Redis caching | upstash.com |
| OpenAI | AI features | platform.openai.com |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
```
