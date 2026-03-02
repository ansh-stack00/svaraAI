const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getAgent(agentId) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (error) throw error
  return data
}

async function getCall(callId) {
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("id", callId)
    .single()

  if (error) throw error
  return data
}

async function insertTranscript(payload) {
  const { error } = await supabase
    .from("transcripts")
    .insert(payload)

  if (error) {
    console.error("Transcript insert error:", error)
  }
}

module.exports = {
  supabase,
  getAgent,
  getCall,
  insertTranscript,
}