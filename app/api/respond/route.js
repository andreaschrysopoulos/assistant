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

// Update Database with new context
async function updateDatabase(context) {

  const sql = neon(process.env.DATABASE_URL)
  const contextJSON = JSON.stringify(context)

  await sql`UPDATE chats SET context = ${contextJSON} WHERE chat_name = 'chat';`
}

// Input: context, Output: Response or Function Call
export async function POST(context) {

  const input = await context.json()
  // updateDatabase(await input);

  let completion = await client.responses.create({
    model: "gpt-4o-mini",
    input: input,
    tools: tools
  })

  // console.log(completion);


  // Function Call
  if (completion?.output[0]?.type === "function_call") {

    const functionReturn = "This is the hidden secret: The rabbit is jumping";

    updateDatabase([...await input, ...completion.output, { type: "function_call_output", call_id: completion.output[0].call_id, output: functionReturn }])

    // Message
  } else if (completion?.output[0]?.type === "message") {
    updateDatabase([...await input, { type: 'message', role: 'assistant', content: completion.output_text }]);
  }

  return new Response(
    JSON.stringify(completion),
    { headers: { "Content-Type": "application/json" } }
  )
}
