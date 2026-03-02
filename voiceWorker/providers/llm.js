const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

async function streamChat(systemPrompt, userText) {
  return openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
    max_tokens: 200,
    stream: true,
  })
}

module.exports = { streamChat }