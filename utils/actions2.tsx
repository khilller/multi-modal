'use server';

import { Weather } from '@/components/Weather';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableUI } from 'ai/rsc';
import { ReactNode } from 'react';
import { z } from 'zod';
import { Recipe, RecipeCard } from '@/components/SingleRecipe';
import { searchRecipes } from './recipe';
import { RecipeCard2 } from '@/components/SingleRecipe2';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
}

interface RecipeSearchResults {
    recipes: Recipe[];
    total: number;
    skip: number;
    limit: number;
  }

export async function continueConversation(history: Message[]) {
  const stream = createStreamableUI();

  const { text, toolResults } = await generateText({
    model: openai('gpt-3.5-turbo'),
    system: 'You are a friendly sous chef.',
    messages: history,
    tools: {
        getRecipe: {
            description: 'Search for recipes based on a ingredient',
            parameters: z.object({
              ingrediants: z.string().describe('The ingrediants to searh for'),
            }),
            execute: async ({ ingrediants }) => {
                const result: RecipeSearchResults = await searchRecipes(ingrediants);
                if (result.recipes.length === 0) {
                    return 'No recipes found';
                }
                result.recipes.map(recipe => (
                    stream.done(<RecipeCard2 recipe={recipe} />)
                ))
                return `Here's the recipe for ${ingrediants} based ingrediant!`;
            }
          }
    },
  });

  //console.log(stream.value)

  return {
    messages: [
      ...history,
      {
        role: 'assistant' as const,
        content:
          text || toolResults.map(toolResult => toolResult.result).join(),
        display: stream.value,
      },
    ],
  };
}