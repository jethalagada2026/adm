'use server';
/**
 * @fileOverview A Genkit flow for generating highly creative and varied team names for hackathons.
 *
 * - generateTeamNameOptions - A function that suggests several creative team names.
 * - TeamNameGeneratorInput - The input type for the function.
 * - TeamNameGeneratorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TeamNameGeneratorInputSchema = z.object({
  description: z.string().describe('The user\'s description, theme, or keywords for the team name.'),
});
export type TeamNameGeneratorInput = z.infer<typeof TeamNameGeneratorInputSchema>;

const TeamNameGeneratorOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of 5 unique, punchy, and modern team names.'),
});
export type TeamNameGeneratorOutput = z.infer<typeof TeamNameGeneratorOutputSchema>;

const teamNamePrompt = ai.definePrompt({
  name: 'teamNamePrompt',
  input: { schema: TeamNameGeneratorInputSchema },
  output: { schema: TeamNameGeneratorOutputSchema },
  config: {
    temperature: 1.0, // Maximum creativity to ensure varied results
    topP: 0.95,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are a world-class creative naming consultant for global hackathons. 
  The user is looking for a team name based on this description or theme: "{{{description}}}"
  
  Your mission: Generate 5 unique, punchy, and futuristic team names. 
  
  Guidelines:
  - Avoid cliches like "Tech Titans" or "Code Wizards".
  - Use high-impact words related to innovation, the future, or the specific keywords provided.
  - Mix metaphors (e.g., "Neon Alchemy", "Quantum Pulse").
  - Ensure every single name is distinct from the others in the list.
  - If the description is vague, lean into a high-tech "Horizon" or "Frontier" theme.`,
});

const teamNameGeneratorFlow = ai.defineFlow(
  {
    name: 'teamNameGeneratorFlow',
    inputSchema: TeamNameGeneratorInputSchema,
    outputSchema: TeamNameGeneratorOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await teamNamePrompt(input);
      if (!output || !output.suggestions || output.suggestions.length === 0) {
        throw new Error("No output from prompt");
      }
      return output;
    } catch (error) {
      console.warn("Team name generation failed, using dynamic fallback:", error);
      // Even more diverse fallback sets to ensure variety during development
      const fallbackSets = [
        ["Vortex Vanguard", "Aether Labs", "Static Pulse", "Digital Druids", "Looming Logic"],
        ["Hyperion Hex", "Binary Bloom", "Solaris Scripts", "Grid Ghost", "Onyx Oracle"],
        ["Prism Pilots", "Echo Engine", "Zenith Zero", "Flux Foundry", "Cobalt Core"],
        ["Stellar Synapse", "Nerve Net", "Alpha Apex", "Vector Void", "Infinite Ink"]
      ];
      const randomSet = fallbackSets[Math.floor(Math.random() * fallbackSets.length)];
      return { suggestions: randomSet };
    }
  }
);

export async function generateTeamNameOptions(input: TeamNameGeneratorInput): Promise<TeamNameGeneratorOutput> {
  return teamNameGeneratorFlow(input);
}
