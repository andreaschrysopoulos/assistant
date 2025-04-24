import OpenAI from "openai"
import { neon } from "@neondatabase/serverless"

const client = new OpenAI()
const tools = [{
  "type": "function",
  "name": "update_memory_file",
  "description": "You can use this function to update the stored memory.",
  "strict": false,
  "parameters": {
    "type": "object",
    "required": [
      "updated_memory_content"
    ],
    "properties": {
      "updated_memory_content": {
        "type": "string",
        "description": "The updated memory content."
      }
    },
    "additionalProperties": false
  }

}];

// Update Database with whole new context
async function updateDatabase(newContext) {
  const sql = neon(process.env.DATABASE_URL)
  await sql`UPDATE main_table SET entry_jsonb = ${JSON.stringify(newContext)} WHERE entry_name = 'context_window';`
}

// Push entry to current context
async function pushToDatabase(entry) {
  const sql = neon(process.env.DATABASE_URL)
  await sql`UPDATE main_table SET entry_jsonb = entry_jsonb || ${JSON.stringify(entry)} WHERE entry_name = 'context_window';`
}

// Update memory file
async function updateMemory(contents) {
  const sql = neon(process.env.DATABASE_URL)
  await sql`UPDATE main_table SET entry_text = ${contents} WHERE entry_name = 'memory_file';`
}




export async function POST(context) {

  // Get JS object
  const input = await context.json()

  // Push new entry to database
  const lastEntry = input.at(-1)
  if (lastEntry.role && lastEntry.role === 'user')
    await pushToDatabase(input.at(-1))

  // Always update the context window with the current system message
  const sql = neon(process.env.DATABASE_URL)
  const system_message = (await sql`SELECT entry_text FROM main_table WHERE entry_name = 'system_message';`)[0].entry_text || ''
  const memory_file = (await sql`SELECT entry_text FROM main_table WHERE entry_name = 'memory_file';`)[0].entry_text || ''

  if (input[0].role === 'system')
    input.shift()

  const now = new Date().toISOString();
  input.unshift({ type: 'message', role: 'system', content: `Current date and time: "${now}", System Message: "${system_message}", Memory file: "${memory_file}"` })

  await updateDatabase(input);

  // Send to LLM
  const response = await client.responses.create({
    model: "gpt-4.1",
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
        tempContext.push({ ...output, arguments: "{}" })
        await pushToDatabase(output)

        // Parse arguments as JSON
        const newMemory = JSON.parse(output.arguments).updated_memory_content
        console.log(newMemory);

        // Call the function to update memory
        await updateMemory(newMemory)

        // Execute function*
        const functionOutput = { type: "function_call_output", call_id: output.call_id, output: "Memory updated successfully." }

        // Push function_output to local context and database
        tempContext.push(functionOutput)
        await pushToDatabase(functionOutput)

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
