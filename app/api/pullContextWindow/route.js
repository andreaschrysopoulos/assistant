import { neon } from "@neondatabase/serverless";

async function pullContextWindow() {
  const sql = neon(process.env.DATABASE_URL);
  const data = await sql`SELECT entry_jsonb FROM main_table WHERE entry_name = 'context_window';`;

  return data[0].entry_jsonb;
}

export async function GET() {

  const data = await pullContextWindow()

  if (Array.isArray(data))
    return new Response(
      JSON.stringify(data, null, 2),
      { headers: { "Content-Type": "application/json" } }
    )
  else
    return new Response(JSON.stringify({ error: 'something is wrong' }, null, 2),
      { headers: { "Content-Type": "application/json" }, status: 500 })
}