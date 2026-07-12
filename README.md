# Camp Ops MVP

This is a first working version of the camp operations app.

## What it includes

- Owner/admin dashboard
- Director approval queue
- Team task lists
- One-time tasks
- Task chat with photo uploads
- Desktop task cards show task details on the left and chat on the right
- Staff request form for QR codes
- Supply/tool requests
- Employee clock in/out
- Basic schedule moving
- Offline browser cache
- Supabase sync through the `app_state` table

## File structure

The app is split by concept so changes stay safer:

- `js/data.js` - starter users, locations, and recurring tasks
- `js/store.js` - local storage, Supabase sync, helpers, and migration
- `js/views/dashboard.js` - owner/director overview
- `js/views/tasks.js` - compact task list and task detail/chat screen
- `js/views/requests.js` - staff request form and approval queue
- `js/views/supplies.js` - supplies, tools, gas, oil, and repair requests
- `js/views/clock.js` - employee clock in/out and payroll table
- `js/views/schedule.js` - schedule blocks and moving tasks
- `js/views/users.js` - user switching and settings screen
- `js/app-main.js` - main navigation and event wiring

## Setup

1. Open Supabase.
2. Go to SQL Editor.
3. Run `supabase-schema.sql`.
4. Open `index.html` in a browser.
5. Paste your Supabase project URL and anon key into the setup screen.

For QR codes, use links like:

```text
https://your-site.example/index.html?request=1&location=10c
```

Change the `location` value to a building/location id.

## Notes

This MVP does not store real passwords. It is intended to get the workflow usable quickly. The next production pass should add Supabase Auth, row-level security, file storage buckets, email invites, and normalized task syncing.

## GitHub

This folder is ready to be pushed to GitHub. Create an empty GitHub repository, then run:

```powershell
git init
git add .
git commit -m "Initial Camp Ops MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```
