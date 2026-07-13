# Camp Ops Supabase Functions

These functions do the secure server-side work that the browser cannot do safely.

## Functions

- `admin-users`: Owner/Director-only invite and Auth-account deletion.
- `send-push`: Sends Web Push notifications to subscriptions saved by the app.

## Required secrets

Set these in Supabase before deploying the functions:

```bash
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set VAPID_SUBJECT="mailto:you@example.com"
supabase secrets set VAPID_PUBLIC_KEY="your-vapid-public-key"
supabase secrets set VAPID_PRIVATE_KEY="your-vapid-private-key"
```

Deploy:

```bash
supabase functions deploy admin-users
supabase functions deploy send-push
```

The app stores only the VAPID public key in Settings. The private VAPID key and service role key must stay in Supabase secrets only.
