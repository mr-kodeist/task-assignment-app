import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Given a task title and the list of valid skill names, ask Claude which
// skill(s) the task requires. Returns skill NAMES (e.g. ["Frontend"]) —
// the caller is responsible for mapping names back to skill IDs.
export async function inferSkillsFromTitle(
  title: string,
  availableSkillNames: string[]
): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 100,
    system: `You classify software development task titles by which skill(s) they require.
Valid skills are exactly: ${availableSkillNames.join(', ')}.
Respond with ONLY a JSON array of the matching skill name(s) from that exact list — no explanation, no markdown, no extra text.
Example response: ["Frontend"]
Example response: ["Frontend", "Backend"]`,
    messages: [
      { role: 'user', content: `Task title: "${title}"` },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];

  try {
    const parsed = JSON.parse(textBlock.text.trim());
    if (Array.isArray(parsed)) {
      // Defensive filter: only keep skill names that are actually valid,
      // in case the model hallucinates something outside our known list.
      return parsed.filter((name) => availableSkillNames.includes(name));
    }
    return [];
  } catch {
    console.error('Failed to parse LLM skill response:', textBlock.text);
    return [];
  }
}