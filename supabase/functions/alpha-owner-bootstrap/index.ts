import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!authHeader || !apiKey || !url || !serviceKey) throw new Error("Missing required authentication configuration.");

    const caller = createClient(url, apiKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await caller.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "A valid signed-in session is required." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const allowedEmail = "dhruv170825@gmail.com";
    if ((user.email ?? "").toLowerCase() !== allowedEmail) {
      return new Response(JSON.stringify({ error: "This email is not authorised to own ALPHA CREATIVE." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: "Verify the owner email address before activating the founder portal." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...(user.app_metadata ?? {}), role: "owner" },
    });
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: "ALPHA CREATIVE owner access activated. Sign in again to refresh your session." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});