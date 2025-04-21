import { OpenAI } from "openai";

const openai = new OpenAI();


export async function GET() {

  const input = [{ role: "user", content: "What is the weather like in Paris today? Do 2 continuous function calls to make sure there's no issue." }]

  let response = await openai.responses.create({
    model: "gpt-4o",
    input: input,
    tools,
  });

  while (true) {
    input.push(response.output[0]);

    if (response.output[0].type === 'function_call') {
      if (response.output[0].name === 'get_weather') {
        console.log("Agent wants to run 'get_weather' function")
        // run function
        const functionReturn = { temperature: 15 };

        input.push({
          type: 'function_call_output',
          call_id: response.output[0].call_id,
          output: JSON.stringify(functionReturn)
        })
        console.log(input);

        response = await openai.responses.create({
          model: "gpt-4o",
          input: input,
          tools,
        });
      }
      else
        console.log(`Agent wants to run an unknown function: ${response.output[0].name}`)
    }
    else
      break
    console.log(response.output[0]);
  }

  return new Response()
}