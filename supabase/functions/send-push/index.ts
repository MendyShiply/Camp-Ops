import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(email: unknown) {
  return String(email || "").trim().toLowerCase();
}

async function hasCampOpsAccess(admin: any, authUser: any) {
  const email = normalizeEmail(authUser.email);
  const profile = await admin
    .from("profiles")
    .select("id,role")
    .or(`auth_user_id.eq.${authUser.id},email.eq.${email}`)
    .maybeSingle();
  if (profile.data) return true;

  const state = await admin.from("app_state").select("data").eq("id", "camp-ops-main").maybeSingle();
  const users = Array.isArray(state.data?.data?.users) ? state.data.data.users : [];
  return users.some((user: any) => normalizeEmail(user.email) === email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return json({ error: "Missing Supabase or VAPID Edge Function secrets" }, 500);
  }

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const authResult = await admin.auth.getUser(token);
  const authUser = authResult.data.user;
  if (!authUser || authResult.error) return json({ error: "Invalid authorization" }, 401);
  if (!(await hasCampOpsAccess(admin, authUser))) return json({ error: "Camp Ops access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "").trim();
  if (!userId) return json({ error: "userId is required" }, 400);

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const payload = JSON.stringify({
    title: String(body.title || "Camp Ops"),
    body: String(body.body || "New Camp Ops notification"),
    url: String(body.url || "/"),
  });

  const subscriptions = await admin.from("push_subscriptions").select("id,subscription").eq("user_id", userId);
  if (subscriptions.error) return json({ error: subscriptions.error.message }, 400);

  const results = await Promise.all((subscriptions.data || []).map(async (row: any) => {
    try {
      await webpush.sendNotification(row.subscription, payload);
      return { id: row.id, ok: true };
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      }
      return { id: row.id, ok: false, error: error?.message || "Push failed" };
    }
  }));

  return json({ ok: true, sent: results.filter((result) => result.ok).length, results });
});
