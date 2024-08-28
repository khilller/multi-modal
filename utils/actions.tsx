'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableUI, createStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { ReactNode } from 'react';
import { searchRecipes } from './recipe';
import { Recipe, RecipeCard } from '@/components/SingleRecipe';
import { RecipeCard2 } from '@/components/SingleRecipe2';
import fs from 'fs';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
  image?: string;
}

interface RecipeSearchResults {
    recipes: Recipe[];
    total: number;
    skip: number;
    limit: number;
  }
  

export async function continueConversation(history: Message[], image?: string) {
  const stream = createStreamableValue();
  const streamUI = createStreamableUI();

  if (image) {

    const { textStream, toolResults: toolResultsPromise } = await streamText({
      model: openai('gpt-4o-mini'),
      system: "You are the best AEC contractor in the world. You will identify the image and explaing what the materials are in about 6 lines. if its not clear, prompt the user to provide only construction based images. ",
      messages: [
        ...history,
        {
          role: 'user',
          content: [
            { type: 'text', text: history[history.length - 1].content },
            {
              type: 'image',
              image: image,
            }
          ]
        }
      ],
      maxTokens: 150,
      onFinish: ({ usage, text }) => {
        const { promptTokens, completionTokens, totalTokens } = usage;
        
        console.log(`Prompt tokens: ${promptTokens}`);
        console.log(`Completion tokens: ${completionTokens}`);
        console.log(`Total tokens: ${totalTokens}`);
        console.log(text);
      }
    });

    (async () => {
      for await (const text of textStream) {
        stream.update(text);
      }

      
      stream.done();
      streamUI.done();
      //console.log(streamUI.value);    
    })();

  } else {
      const { textStream, toolResults: toolResultsPromise } = await streamText({
        model: openai('gpt-3.5-turbo'),
        system: "You are a helpful assistant",
        messages: history,
        tools: {
          celsiusToFahrenheit: {
            description: 'Converts celsius to fahrenheit',
            parameters: z.object({
              value: z.string().describe('The value in celsius'),
            }),
            execute: async ({ value }) => {
              const celsius = parseFloat(value);
              const fahrenheit = celsius * (9 / 5) + 32;
              return `${celsius}°C is ${fahrenheit.toFixed(2)}°F`;
            },
          },
          writeApoem: {
            description: 'Write a poem based on a theme',
            parameters: z.object({
              theme: z.string().describe('The theme of the poem'),
            }),
            execute: async ({ theme }) => {
              let poem = '';
              const poemStream = await streamText({
              model: openai('gpt-3.5-turbo'),
              messages: [
                { role: 'user', content: `Write a poem about ${theme}` }
              ],
              maxTokens: 400,
            });
            
            for await (const chunk of poemStream.textStream) {
              stream.update(chunk);
            }
            
            return 'Poem written';
          }
        },
        explainTerms: {
          description: 'Explain terms used in the AEC industry',
          parameters: z.object({
            term: z.string().describe('The term to explain'),
          }),
          execute: async ({ term }) => {
            const explainStream = await streamText({
              model: openai('gpt-3.5-turbo'),
              system: "You are a professional Contractor",
              messages: [
                { role: 'user', content: `Explain ${term}` }
              ],
              maxTokens: 400,
            })
            
            for await (const chunk of explainStream.textStream) {
              stream.update(chunk);
            }
          }
        },
        getRecipe: {
          description: 'Get a recipe based on ingrediants',
          parameters: z.object({
            ingrediants: z.string().describe('The ingrediants to use'),
          }),
          execute: async ({ ingrediants }) => {
            const result: RecipeSearchResults = await searchRecipes(ingrediants);
            //console.log(result);
            streamUI.update(`...Searching for recipes based on ${ingrediants}`);
            if (result.recipes.length === 0) {
              streamUI.update('No recipes found');
              return 'No recipes found';
            }
            result.recipes.map(recipe => (
              stream.update("Here's the recipe for " + ingrediants),
              streamUI.update(<RecipeCard2 recipe={recipe} />)
            ))
            return `Here's the recipe for ${ingrediants} based ingrediant!`;
          }
        },
      },
      onFinish: ({ usage }) => {
        const { promptTokens, completionTokens, totalTokens } = usage;
        
        console.log(`Prompt tokens: ${promptTokens}`);
        console.log(`Completion tokens: ${completionTokens}`);
        console.log(`Total tokens: ${totalTokens}`);
      }
    });
    
    (async () => {
      for await (const text of textStream) {
        stream.update(text);
      }
      
      if (toolResultsPromise) {
        const toolResults = await toolResultsPromise;
        for (const toolResult of toolResults) {
          if (toolResult.toolName === 'getRecipe') {
            
          } else if (toolResult.toolName !== 'writeApoem' && toolResult.toolName !== 'explainTerms') {
            stream.update(toolResult.result);
          }
        }
      }
      
      stream.done();
      streamUI.done();
      //console.log(streamUI.value);    
    })();
}
  
  return {
    messages: history,
    newMessage: stream.value,
    display: streamUI.value,
  };
}


/**

  if (image) {

    const { textStream, toolResults: toolResultsPromise } = await streamText({
      model: openai('gpt-4o-mini'),
      system: "You are the best AEC contractor in the world. You will identify the image and explaing what the materials are. if its not clear, prompt the user to provide only construction based images.",
      messages: [
        ...history,
        {
          role: 'user',
          content: [
            { type: 'text', text: history[history.length - 1].content },
            {
              type: 'image',
              image: image,
            }
          ]
        }
      ],
      onFinish: ({ usage }) => {
        const { promptTokens, completionTokens, totalTokens } = usage;
        
        console.log(`Prompt tokens: ${promptTokens}`);
        console.log(`Completion tokens: ${completionTokens}`);
        console.log(`Total tokens: ${totalTokens}`);
      }
    });

    (async () => {
      for await (const text of textStream) {
        stream.update(text);
      }
      
      stream.done();
      streamUI.done();
      //console.log(streamUI.value);    
    })();

  } else
 */