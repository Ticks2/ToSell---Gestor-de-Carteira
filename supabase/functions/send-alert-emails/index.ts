import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Job started: send-alert-emails')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Client with Service Role Key to access all data
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Identify Due Alerts
    // Criteria: Today, Not Dismissed, Not Notified
    const today = new Date().toISOString().split('T')[0]

    const { data: alerts, error: alertsError } = await supabase
      .from('client_alerts')
      .select(
        `
        id,
        alert_type,
        alert_date,
        message,
        user_id,
        client_id,
        client:clients (
          full_name
        )
      `,
      )
      .eq('alert_date', today)
      .eq('is_dismissed', false)
      .eq('is_email_notified', false)

    if (alertsError) throw alertsError

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending alerts found.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    console.log(`Found ${alerts.length} pending alerts.`)

    const results = []

    // 2. Process each alert
    for (const alert of alerts) {
      try {
        // 3. Retrieve User Preferences and Email
        // We need to fetch the profile for settings and auth user for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('notification_settings')
          .eq('user_id', alert.user_id)
          .single()

        if (profileError) {
          console.error(
            `Error fetching profile for user ${alert.user_id}:`,
            profileError,
          )
          continue
        }

        const settings = profile?.notification_settings || {}
        const typeSettings = settings[alert.alert_type]

        // 4. Conditional Sending
        // Check if email notification is enabled for this type
        if (typeSettings && typeSettings.email === true) {
          // Get User Email via Admin API
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.admin.getUserById(alert.user_id)

          if (userError || !user || !user.email) {
            console.error(
              `Error fetching user email for ${alert.user_id}:`,
              userError,
            )
            continue
          }

          // 5. "Send" Email (Mocking implementation as per instructions)
          console.log(`[MOCK EMAIL] Sending to: ${user.email}`)
          console.log(
            `[MOCK EMAIL] Subject: Novo Alerta CRM: ${alert.alert_type}`,
          )
          console.log(
            `[MOCK EMAIL] Body: Olá, você tem um alerta de ${alert.alert_type} para o cliente ${alert.client?.full_name}. Mensagem: ${alert.message}`,
          )

          // 6. Mark as Notified
          const { error: updateError } = await supabase
            .from('client_alerts')
            .update({ is_email_notified: true })
            .eq('id', alert.id)

          if (updateError) {
            console.error(`Failed to update alert ${alert.id}:`, updateError)
          } else {
            results.push({ alert_id: alert.id, status: 'sent', to: user.email })
          }
        } else {
          results.push({
            alert_id: alert.id,
            status: 'skipped',
            reason: 'preferences_disabled',
          })
        }
      } catch (err) {
        console.error(`Error processing alert ${alert.id}:`, err)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
