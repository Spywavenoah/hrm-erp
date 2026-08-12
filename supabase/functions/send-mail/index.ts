import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.15";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SmtpSettings {
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: string;
  from_name: string;
  from_email: string;
}

async function getSmtpSettings(supabase: ReturnType<typeof createClient>): Promise<SmtpSettings | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value")
    .eq("group_name", "smtp");

  if (error || !data || data.length === 0) return null;

  const settings: Record<string, string> = {};
  for (const row of data) {
    settings[row.key] = String(row.value);
  }

  if (!settings.host || !settings.from_email) return null;

  return {
    host: settings.host,
    port: settings.port || "587",
    username: settings.username || "",
    password: settings.password || "",
    encryption: settings.encryption || "TLS",
    from_name: settings.from_name || "HR System",
    from_email: settings.from_email,
  };
}

async function getMailTemplate(
  supabase: ReturnType<typeof createClient>,
  eventKey: string
): Promise<{ subject: string; body_html: string } | null> {
  const { data, error } = await supabase
    .from("mail_templates")
    .select("subject, body_html, is_active")
    .eq("event_key", eventKey)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return { subject: data.subject, body_html: data.body_html };
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

async function sendViaSmtp(
  smtp: SmtpSettings,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<void> {
  const port = parseInt(smtp.port, 10);
  const secure = smtp.encryption === "SSL";
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port,
    secure,
    requireTLS: smtp.encryption === "TLS",
    auth: smtp.username ? { user: smtp.username, pass: smtp.password } : undefined,
  });

  await transporter.sendMail({
    from: `${smtp.from_name} <${smtp.from_email}>`,
    to,
    subject,
    html: bodyHtml,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const forceId = body?.notification_id;

    let query = supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(10);

    if (forceId) {
      query = supabase
        .from("notification_queue")
        .select("*")
        .eq("id", forceId)
        .limit(1);
    }

    const { data: notifications, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No pending notifications" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smtp = await getSmtpSettings(supabase);
    if (!smtp) {
      return new Response(JSON.stringify({ sent: 0, error: "SMTP not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const notif of notifications) {
      const meta = notif.metadata || {};
      let subject = notif.subject;
      let bodyHtml = notif.body_html;

      if (notif.event_key && !subject) {
        const template = await getMailTemplate(supabase, notif.event_key);
        if (template) {
          subject = interpolate(template.subject, meta);
          bodyHtml = interpolate(template.body_html, meta);
        }
      }

      try {
        await sendViaSmtp(smtp, notif.recipient_email, subject, bodyHtml);
        await supabase
          .from("notification_queue")
          .update({ status: "SENT", sent_at: new Date().toISOString(), attempts: notif.attempts + 1 })
          .eq("id", notif.id);
        sentCount++;
      } catch (err) {
        await supabase
          .from("notification_queue")
          .update({
            status: notif.attempts >= 2 ? "FAILED" : "PENDING",
            error_message: (err as Error).message,
            attempts: notif.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notif.id);
        failedCount++;
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
