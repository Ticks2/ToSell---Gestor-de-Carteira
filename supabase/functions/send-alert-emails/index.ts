import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Get unnotified alerts that are not dismissed
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('client_alerts')
      .select('*, clients(*)')
      .is('is_email_notified', null)
      .eq('is_dismissed', false)

    if (alertsError) throw alertsError

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No new alerts to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const results = []

    // 2. Process each alert
    for (const alert of alerts) {
      // Get user profile for settings
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('notification_settings, user_id')
        .eq('user_id', alert.user_id)
        .single()

      if (profileError) {
        console.error(
          `Error fetching profile for user ${alert.user_id}:`,
          profileError,
        )
        continue
      }

      // Check notification settings
      // Expected settings format: { email_alerts: boolean, alert_types: string[] }
      const settings = profile.notification_settings as any
      const emailEnabled = settings?.email_alerts !== false // Default to true if not set
      const typeEnabled = settings?.alert_types
        ? settings.alert_types.includes(alert.alert_type)
        : true // Default to true if no specific types defined

      if (!emailEnabled || !typeEnabled) {
        // Skip sending email, but mark as notified to prevent re-processing
        await supabaseClient
          .from('client_alerts')
          .update({ is_email_notified: true })
          .eq('id', alert.id)

        results.push({ id: alert.id, status: 'skipped_by_settings' })
        continue
      }

      // Get User Email via Admin API
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.admin.getUserById(alert.user_id)

      if (userError || !user?.email) {
        console.error(`Error fetching user email for ${alert.user_id}`)
        continue
      }

      // Simulate Sending Email (Use Resend, SendGrid, etc in production)
      console.log(
        `[MOCK EMAIL] To: ${user.email} | Subject: New Alert: ${alert.alert_type} | Body: ${alert.message}`,
      )

      // Update alert status
      await supabaseClient
        .from('client_alerts')
        .update({ is_email_notified: true })
        .eq('id', alert.id)

      results.push({ id: alert.id, status: 'sent', email: user.email })
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
