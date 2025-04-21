import OpenAI from "openai"
import { neon } from "@neondatabase/serverless"

const client = new OpenAI()
const tools = [{
  "type": "function",
  "name": "reveal_secret",
  "description": "Given the right magic word, the function will return the hidden secret.",
  "strict": false,
  "parameters": {
    "type": "object",
    "required": [
      "magic_word"
    ],
    "properties": {
      "magic_word": {
        "type": "string",
        "description": "The word required to reveal the secret."
      }
    },
    "additionalProperties": false
  }

}];

// Update Database with whole new context
async function updateDatabase(newContext) {
  const sql = neon(process.env.DATABASE_URL)
  await sql`UPDATE chats SET context = ${JSON.stringify(newContext)} WHERE chat_name = 'chat';`
}

// Push entry to current context
async function pushToDatabase(entry) {
  const sql = neon(process.env.DATABASE_URL)
  await sql`UPDATE chats SET context = context || ${JSON.stringify(entry)} WHERE chat_name = 'chat';`
}


export async function POST(context) {

  // Get JS object
  const input = await context.json()

  // Push new entry to database
  const lastEntry = input.at(-1)

  if (lastEntry.role && lastEntry.role === 'user')
    await pushToDatabase(input.at(-1))

  // Send to LLM
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: input,
    tools: tools
  })

  // Catch potential error in completion response
  if (response.error)
    return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" }, status: 500 })

  const tempContext = []

  for (const output of response.output) {

    switch (output.type) {

      case "function_call":
        // Push function_call to local context and database
        tempContext.push(output)
        await pushToDatabase(output)

        // Execute function*
        const functionOutput = { type: "function_call_output", call_id: output.call_id, output: "The hidden secret is love" }

        // Push function_output to local context and database
        tempContext.push(functionOutput)
        await pushToDatabase(functionOutput)
        console.log("hello!");
        continue

      case "message":

        const assistantMessage = { type: 'message', role: 'assistant', content: output.content[0].text }

        // Push assistant reply to local context and database
        tempContext.push(assistantMessage)
        await pushToDatabase(assistantMessage)
    }
  }

  return new Response(JSON.stringify(tempContext), { headers: { "Content-Type": "application/json" } })

}
