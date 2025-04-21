export async function GET() {
  console.log("1. Before simulated delay");

  // Simulate slow fetch with a 3-second timeout
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("2. After simulated delay");

  return new Response(
    JSON.stringify({ message: "Done waiting!" }),
    { headers: { "Content-Type": "application/json" } }
  );
}