'use server';
/**
 * @fileOverview A Genkit flow for generating personalized welcome emails for hackathon team leaders.
 *
 * - sendPersonalizedWelcomeEmail - A function that generates a personalized welcome email.
 * - PersonalizedWelcomeEmailInput - The input type for the sendPersonalizedWelcomeEmail function.
 * - PersonalizedWelcomeEmailOutput - The return type for the sendPersonalizedWelcomeEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedWelcomeEmailInputSchema = z.object({
  leaderName: z.string().describe("The name of the team leader."),
  leaderEmail: z.string().email().describe("The email address of the team leader."),
  hackathonName: z.string().describe("The name of the hackathon."),
  submissionDeadline: z.string().describe("The submission deadline for the hackathon (e.g., 'April 6th')."),
});
export type PersonalizedWelcomeEmailInput = z.infer<typeof PersonalizedWelcomeEmailInputSchema>;

const PersonalizedWelcomeEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line of the welcome email."),
  body: z.string().describe("The personalized body content of the welcome email."),
});
export type PersonalizedWelcomeEmailOutput = z.infer<typeof PersonalizedWelcomeEmailOutputSchema>;

const personalizedWelcomeEmailPrompt = ai.definePrompt({
  name: 'personalizedWelcomeEmailPrompt',
  input: {schema: PersonalizedWelcomeEmailInputSchema},
  output: {schema: PersonalizedWelcomeEmailOutputSchema},
  prompt: `As an AI assistant, your task is to compose a personalized welcome email for a hackathon team leader.

The email should be friendly, professional, and contain the following information:
- A warm welcome to the hackathon, mentioning the hackathon name.
- Confirmation of their registration.
- Important next steps, including the submission deadline for their PPT in PDF format, problem statement, and abstract.
- Encourage them to reach out if they have any questions.

Use the following details:
Team Leader Name: {{{leaderName}}}
Team Leader Email: {{{leaderEmail}}}
Hackathon Name: {{{hackathonName}}}
Submission Deadline: {{{submissionDeadline}}}

Compose the email subject and body in a JSON object with 'subject' and 'body' fields.
`,
});

const personalizedWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'personalizedWelcomeEmailFlow',
    inputSchema: PersonalizedWelcomeEmailInputSchema,
    outputSchema: PersonalizedWelcomeEmailOutputSchema,
  },
  async (input) => {
    const {output} = await personalizedWelcomeEmailPrompt(input);
    return output!;
  }
);

export async function sendPersonalizedWelcomeEmail(input: PersonalizedWelcomeEmailInput): Promise<PersonalizedWelcomeEmailOutput> {
  return personalizedWelcomeEmailFlow(input);
}
