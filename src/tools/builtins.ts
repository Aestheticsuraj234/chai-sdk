import {tool} from "./tool";

export const calculator = tool(
    "calculator",
    "Add two numbers together",
    (args: { a: number; b: number }) => args.a + args.b,
    {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
  );

  export const echo = tool(
    "echo",
    "Return the input message back",
    (args: { message: string }) => args.message,
    {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to echo back" },
      },
      required: ["message"],
    },
  );