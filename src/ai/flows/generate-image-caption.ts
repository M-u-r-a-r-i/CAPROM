'use server';
/**
 * @fileOverview An image caption generator AI agent.
 *
 * - generateImageCaption - A function that handles the image caption generation process.
 * - GenerateImageCaptionInput - The input type for the generateImageCaption function.
 * - GenerateImageCaptionOutput - The return type for the generateImageCaption function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateImageCaptionInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the image to caption.'),
});
export type GenerateImageCaptionInput = z.infer<typeof GenerateImageCaptionInputSchema>;

const GenerateImageCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the image.'),
});
export type GenerateImageCaptionOutput = z.infer<typeof GenerateImageCaptionOutputSchema>;

export async function generateImageCaption(input: GenerateImageCaptionInput): Promise<GenerateImageCaptionOutput> {
  return generateImageCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageCaptionPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the image to caption.'),
    }),
  },
  output: {
    schema: z.object({
      caption: z.string().describe('The generated caption for the image.'),
    }),
  },
  prompt: `You are an AI that generates captions for images.

  Generate a straightforward, descriptive caption for the following image. Focus on describing the content of the image in a clear and concise manner.

  Image: {{media url=photoUrl}}
  `,
});

const generateImageCaptionFlow = ai.defineFlow<
  typeof GenerateImageCaptionInputSchema,
  typeof GenerateImageCaptionOutputSchema
>({
  name: 'generateImageCaptionFlow',
  inputSchema: GenerateImageCaptionInputSchema,
  outputSchema: GenerateImageCaptionOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
