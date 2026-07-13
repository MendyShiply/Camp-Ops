import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

async function operatorRole(admin: any, authUser: any) {
  const email = normalizeEmail(authUser.email);
  const profile = await admin
    .from("profiles")
    .select("role")
    .or(`auth_user_id.eq.${authUser.id},email.eq.${email}`)
    .maybeSingle();
  if (profile.data?.role) return profile.data.role;

  const state = await admin.from("app_state").select("data").eq("id", "camp-ops-main").maybeSingle();
  const users = Array.isArray(state.data?.data?.users) ? state.data.data.users : [];
  const appUser = users.find((user: any) => normalizeEmail(user.email) === email);
  return appUser?.role || "";
}

async function audit(admin: any, authUser: any, action: string, targetEmail: string, targetUserId = "", metadata: Record<string, unknown> = {}) {
  await admin.from("admin_audit_log").insert({
    actor_auth_user_id: authUser.id,
    action,
    target_email: targetEmail,
    target_user_id: targetUserId,
    metadata,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase Edge Function secrets" }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const authResult = await admin.auth.getUser(token);
  const authUser = authResult.data.user;
  if (!authUser || authResult.error) return json({ error: "Invalid authorization" }, 401);

  const role = await operatorRole(admin, authUser);
  if (!["owner", "director"].includes(role)) return json({ error: "Owner or Director access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const email = normalizeEmail(body.email);
  if (!email) return json({ error: "Email is required" }, 400);

  if (action === "invite") {
    const redirectTo = String(body.redirectTo || "");
    const result = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || undefined,
      data: {
        first_name: body.firstName || "",
        last_name: body.lastName || "",
        phone: body.phone || "",
        role: body.role || "worker",
      },
    });
    if (result.error) return json({ error: result.error.message }, 400);
    await audit(admin, authUser, "invite", email, result.data.user?.id || "", { role: body.role || "worker" });
    return json({ ok: true, userId: result.data.user?.id || "" });
  }

  if (action === "deleteByEmail") {
    let page = 1;
    let matched: any = null;
    while (!matched && page <= 20) {
      const listed = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listed.error) return json({ error: listed.error.message }, 400);
      matched = listed.data.users.find((user: any) => normalizeEmail(user.email) === email);
      if (!listed.data.users.length || listed.data.users.length < 1000) break;
      page += 1;
    }
    if (!matched) {
      await audit(admin, authUser, "deleteByEmail:not_found", email);
      return json({ ok: true, deleted: false, reason: "Auth user not found" });
    }
    const deleted = await admin.auth.admin.deleteUser(matched.id);
    if (deleted.error) return json({ error: deleted.error.message }, 400);
    await audit(admin, authUser, "deleteByEmail", email, matched.id);
    return json({ ok: true, deleted: true, userId: matched.id });
  }

  return json({ error: "Unknown action" }, 400);
});
