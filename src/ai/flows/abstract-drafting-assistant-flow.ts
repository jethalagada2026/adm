'use server';
/**
 * @fileOverview An AI assistant flow for drafting or refining project abstracts.
 *
 * - draftAbstract - A function that helps draft or refine a project abstract.
 * - AbstractDraftingAssistantInput - The input type for the draftAbstract function.
 * - AbstractDraftingAssistantOutput - The return type for the draftAbstract function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AbstractDraftingAssistantInputSchema = z.object({
  problemStatement: z
    .string()
    .describe('The core problem that the project aims to solve.'),
  keyDetails: z
    .string()
    .describe('Key details, features, or approach of the project.'),
});
export type AbstractDraftingAssistantInput = z.infer<
  typeof AbstractDraftingAssistantInputSchema
>;

const AbstractDraftingAssistantOutputSchema = z.object({
  draftedAbstract: z
    .string()
    .describe('A compelling and clear draft of the project abstract.'),
});
export type AbstractDraftingAssistantOutput = z.infer<
  typeof AbstractDraftingAssistantOutputSchema
>;

export async function draftAbstract(
  input: AbstractDraftingAssistantInput
): Promise<AbstractDraftingAssistantOutput> {
  return abstractDraftingAssistantFlow(input);
}

const abstractDraftingAssistantPrompt = ai.definePrompt({
  name: 'abstractDraftingAssistantPrompt',
  input: { schema: AbstractDraftingAssistantInputSchema },
  output: { schema: AbstractDraftingAssistantOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert abstract writer for hackathon projects. Your goal is to create a compelling and clear project abstract based on the provided problem statement and key details.

If the input appears to be placeholder text or nonsensical, try your best to interpret the intent or provide a high-quality generic template that the user can fill in.

The abstract should:
- Be concise, typically 150-250 words.
- Clearly state the problem.
- Briefly describe your solution and its unique approach.
- Highlight the potential impact or benefits.
- Be engaging and suitable for a hackathon submission.

Problem Statement:
{{{problemStatement}}}

Key Details about the Project:
{{{keyDetails}}}

Please draft the project abstract now.`,
});

const abstractDraftingAssistantFlow = ai.defineFlow(
  {
    name: 'abstractDraftingAssistantFlow',
    inputSchema: AbstractDraftingAssistantInputSchema,
    outputSchema: AbstractDraftingAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await abstractDraftingAssistantPrompt(input);
      if (!output) {
        return { draftedAbstract: "Our project addresses a critical challenge in our chosen field through innovative application of technology and creative problem-solving." };
      }
      return output;
    } catch (error) {
      console.warn("Abstract generation failed, using fallback:", error);
      return { draftedAbstract: "Our solution leverages modern technology to solve the stated problem statement effectively, focusing on scalability and user impact." };
    }
  }
);
