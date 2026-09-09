export type Guardrail = (ctx: {
  prompt?: string;
  tool?: string;
  reply?: string;
}) => { pass: boolean; reason?: string };

export function blockTool(toolName: string): Guardrail {
  return (ctx) => {
    if (ctx.tool === toolName) {
      return { pass: false, reason: `Tool "${toolName}" is blocked` };
    }
    return { pass: true };
  };
}

export function contentFilter(words: string[]): Guardrail {
  return (ctx) => {
    const text = (ctx.prompt ?? ctx.reply ?? "").toLowerCase();
    for (const word of words) {
      if (text.includes(word.toLowerCase())) {
        return { pass: false, reason: `Blocked word: "${word}"` };
      }
    }
    return { pass: true };
  };
}
