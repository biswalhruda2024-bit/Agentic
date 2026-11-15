# TaskFlow Manager

A deploy-ready task manager built with Next.js, Supabase, and Vercel.

## Features
- Email/password authentication
- Create and delete tasks
- Start/due date and time
- Priority and status
- Slider-based progress tracking
- Overdue indicators and dashboard totals
- Real-time updates across browser tabs/devices
- Row Level Security so users only see their own tasks
- Responsive UI

## Local setup
1. Create a Supabase project.
2. Open the Supabase SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Providers, keep Email enabled. For quick testing, you may disable email confirmation.
4. Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
5. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## GitHub and Vercel deployment
1. Create a GitHub repository and push this folder.
2. In Vercel, choose **Add New > Project**, then import the repository.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. In Supabase Authentication > URL Configuration, set the Site URL to your Vercel production URL.

## Notes
- Task updates are in-app/live updates. Email, push, or WhatsApp reminders require a scheduled notification service and provider.
- Before a production launch, pin package versions after your first successful install by committing `package-lock.json`.
