import { neon } from "@neondatabase/serverless";

async function clearContextWindow() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE main_table SET entry_jsonb = '[]' WHERE entry_name = 'context_window';`;
}

export async function PATCH() {

  await clearContextWindow();

  return new Response(
    JSON.stringify({ status: 200, message: "Chat cleared successfully." }),
    { headers: { "Content-Type": "application/json" } }
  );
}
