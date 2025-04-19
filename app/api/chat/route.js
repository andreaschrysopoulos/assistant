import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

export async function POST(request) {
  const { input } = await request.json();
  const completion = await client.responses.create({
    model: "gpt-4o",
    input
  });

  return new Response(
    JSON.stringify({ reply: completion.output_text }),
    { headers: { "Content-Type": "application/json" } }
  );
}
