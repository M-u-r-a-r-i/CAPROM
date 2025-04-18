// Implemented by Gemini.
'use server';
/**
 * @fileOverview This file defines a Genkit flow for improving the quality of image captions using advanced reasoning.
 *
 * - improveCaptionQuality - A function that enhances a given caption for an image.
 * - ImproveCaptionQualityInput - The input type for the improveCaptionQuality function.
 * - ImproveCaptionQualityOutput - The return type for the improveCaptionQuality function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ImproveCaptionQualityInputSchema = z.object({
  imageUrl: z.string().describe('The URL of the image to caption.'),
  initialCaption: z.string().describe('The initial caption generated for the image.'),
});
export type ImproveCaptionQualityInput = z.infer<typeof ImproveCaptionQualityInputSchema>;

const ImproveCaptionQualityOutputSchema = z.object({
  improvedCaption: z.string().describe('The improved caption for the image.'),
});
export type ImproveCaptionQualityOutput = z.infer<typeof ImproveCaptionQualityOutputSchema>;

export async function improveCaptionQuality(input: ImproveCaptionQualityInput): Promise<ImproveCaptionQualityOutput> {
  return improveCaptionQualityFlow(input);
}

const improveCaptionQualityPrompt = ai.definePrompt({
  name: 'improveCaptionQualityPrompt',
  input: {
    schema: z.object({
      imageUrl: z.string().describe('The URL of the image to caption.'),
      initialCaption: z.string().describe('The initial caption generated for the image.'),
    }),
  },
  output: {
    schema: z.object({
      improvedCaption: z.string().describe('The improved caption for the image.'),
    }),
  },
  prompt: `You are an expert caption writer, skilled at creating engaging and relevant captions for images.

  Your goal is to improve the quality of an initial caption provided for an image. Consider the image content and context to refine the caption, making it more descriptive, engaging, and shareable.

  Here is the initial caption:
  """{{initialCaption}}"""

  Here is the image:
  {{media url=imageUrl}}

  Provide an improved caption that is high-quality, relevant, and engaging.
  `,
});

const improveCaptionQualityFlow = ai.defineFlow<
  typeof ImproveCaptionQualityInputSchema,
  typeof ImproveCaptionQualityOutputSchema
>({
  name: 'improveCaptionQualityFlow',
  inputSchema: ImproveCaptionQualityInputSchema,
  outputSchema: ImproveCaptionQualityOutputSchema,
}, async input => {
  const {output} = await improveCaptionQualityPrompt(input);
  return output!;
});
