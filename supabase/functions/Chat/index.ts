// Deployed via the Supabase Dashboard (Edge Functions → Deploy a new function → Via Editor).
// This file is kept in the repo for reference/history; the dashboard editor is the source
// of truth for what's actually running. Requires a GROQ_API_KEY secret set in the project's
// Edge Function secrets (never embedded in client code).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'log_food_items',
      description:
        'Erfasst Lebensmittel, die der Nutzer gegessen hat oder eintragen möchte, strukturiert mit Menge und Mahlzeit.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name des Lebensmittels/Gerichts' },
                quantity_g: { type: 'number', description: 'Geschätzte Menge in Gramm' },
                meal_type: {
                  type: 'string',
                  enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                  description: 'Passende Mahlzeit; falls nicht genannt anhand der Uhrzeit schätzen',
                },
              },
              required: ['name', 'quantity_g', 'meal_type'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!GROQ_API_KEY) {
    return json({ error: 'Server misconfigured: GROQ_API_KEY missing' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return json({ error: 'Missing message' }, 400)
    }

    const systemPrompt = `Du bist ein hilfreicher Ernährungs-Assistent in einer Kalorien-Tracking-App. Aktuelles Datum/Uhrzeit: ${new Date().toISOString()}.
Wenn der Nutzer beschreibt, was er gegessen hat oder essen möchte, rufe die Funktion log_food_items auf und strukturiere jedes Lebensmittel einzeln (Name, geschätzte Menge in Gramm, passende Mahlzeit).
Wenn der Nutzer stattdessen eine allgemeine Frage zu Ernährung, Kalorien oder der App stellt, antworte kurz und hilfreich als normalen Text, ohne die Funktion aufzurufen.
Antworte immer auf Deutsch.`

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        tools,
        tool_choice: 'auto',
      }),
    })

    if (!groqResponse.ok) {
      const detail = await groqResponse.text()
      return json({ error: 'AI request failed', detail }, 502)
    }

    const groqData = await groqResponse.json()
    const choice = groqData.choices?.[0]?.message
    const toolCall = choice?.tool_calls?.[0]

    if (toolCall?.function?.name === 'log_food_items') {
      let items = []
      try {
        items = JSON.parse(toolCall.function.arguments)?.items ?? []
      } catch {
        items = []
      }
      return json({ reply: 'Ich habe folgende Lebensmittel erkannt:', items })
    }

    return json({ reply: choice?.content ?? 'Entschuldigung, das konnte ich nicht verarbeiten.', items: [] })
  } catch (err) {
    return json({ error: 'Internal error', detail: String(err) }, 500)
  }
})
