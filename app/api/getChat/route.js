import { neon } from "@neondatabase/serverless";

async function getData() {
  const sql = neon(process.env.DATABASE_URL);
  const data = await sql`SELECT * FROM chats LIMIT 1;`;

  return data[0];
}

export async function GET() {

  const data = await getData()

  if (data.id && data.chat_name && Array.isArray(data.context))
    return new Response(
      JSON.stringify(data, null, 2),
      { headers: { "Content-Type": "application/json" } }
    )
  else
    return new Response(JSON.stringify({ error: 'something is wrong' }, null, 2),
      { headers: { "Content-Type": "application/json" }, status: 500 })
}