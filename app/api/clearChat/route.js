import { neon } from "@neondatabase/serverless";

async function clearChat() {
  const sql = neon(process.env.DATABASE_URL);
  const data = await sql`UPDATE chats SET context = '[]' WHERE chat_name = 'chat';`;
  return data[0];
}

export async function PATCH() {

  await clearChat();

  return new Response(
    JSON.stringify({ status: 200 }),
    { headers: { "Content-Type": "application/json" } }
  );
}
