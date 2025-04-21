import { neon } from "@neondatabase/serverless";

async function getData() {
  const sql = neon(process.env.DATABASE_URL);
  const data = await sql`SELECT * FROM chats;`;
  return data[0];
}

export async function GET() {

  return new Response(
    JSON.stringify(await getData()),
    { headers: { "Content-Type": "application/json" } }
  );
}
