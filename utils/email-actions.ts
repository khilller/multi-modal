'use server'

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createStreamableValue } from 'ai/rsc'
import { z } from 'zod'

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

type ToolResult = {
    toolName: string;
    args: Record<string, any>;
}

// Simulated email data
const emails = [
  { id: 1, sender: 'john@example.com', subject: 'Meeting tomorrow', content: 'Hi, just a reminder about our meeting tomorrow at 2 PM. We\'ll be discussing the Q3 projections and the new marketing strategy. Please bring any relevant materials.' },
  { id: 2, sender: 'sarah@example.com', subject: 'Project update', content: 'Here\'s the latest update on the project. We\'ve completed the initial design phase and are moving into development. The timeline looks good, but we might need to adjust our budget. Let\'s schedule a call to discuss the details.' },
  { id: 3, sender: 'mike@example.com', subject: 'Lunch next week?', content: 'Hey, want to grab lunch next week? I was thinking we could try that new Italian place downtown. They have great pasta and a nice outdoor seating area. Let me know what day works for you.' },
]

export async function processEmailQuery(history: Message[]) {
  const stream = createStreamableValue('');

  const { textStream, toolResults: toolResultsPromise } = await streamText({
    model: openai('gpt-4o-mini-2024-07-18'),
    system: "You are an AI assistant that helps manage emails. You can search for emails, summarize emails, and send email replies. When searching for emails, consider the sender's name or email address as well as the subject and content. Try asking me to search for emails with a specific query or summarize a list of emails.",
    messages: [
        ...history,
        {
            role: 'user',
            content: [
                { type: 'text', text: history[history.length - 1].content }
            ]
        }
    ],
    tools: {
      searchEmails: {
        description: "Search for emails based on a query. This searches the sender's email, subject, and content.",
        parameters: z.object({
          query: z.string().describe('The search query for emails')
        }),
        execute: async ({ query }) => {
            const results = emails.filter(email => 
                email.sender.toLowerCase().includes(query.toLowerCase()) || 
                email.subject.toLowerCase().includes(query.toLowerCase()) || 
                email.content.toLowerCase().includes(query.toLowerCase())
            )
            return results;
        }

      },
      summarizeEmails: {
        description: "Summarize emails",
        parameters: z.object({
          emailIds: z.array(z.number()).describe('Array of email IDs to summarize')
        })
      },
      sendEmail: {
        description: "Send an email reply",
        parameters: z.object({
          to: z.string().describe('Email address of the recipient'),
          content: z.string().describe('Content of the email reply')
        })
      }
    },
    onFinish: async ({ usage, toolResults }) => {
      const { promptTokens, completionTokens, totalTokens } = usage;
      console.log(`Prompt tokens: ${promptTokens}`);
      console.log(`Completion tokens: ${completionTokens}`);
      console.log(`Total tokens: ${totalTokens}`);

      if (toolResults) {
        console.log('Tool results:', toolResults);
      }
    },
    toolChoice: "auto"
  });

  (async () => {
      
      for await (const text of textStream) {
          stream.update(text);
        }
        
      try {
            if (toolResultsPromise) {
                const toolResults = await toolResultsPromise as ToolResult[];
                for (const toolCall of toolResults) {
                    if (toolCall.toolName === 'searchEmails') {
                        try {
                            const query = toolCall.args.query.toLowerCase();
                            console.log(`Searching for emails with query: ${query}`);
                            const results = emails.filter(email => 
                                email.sender.toLowerCase().includes(query) ||
                                email.subject.toLowerCase().includes(query) || 
                                email.content.toLowerCase().includes(query)
                            );
                            if (results.length > 0) {
                                const resultText = results.map(email => `Found email from ${email.sender}: ${email.subject}`).join('\n');
                                stream.update(resultText);
                            } else {
                                stream.update(`No emails from ${query}`);
                            }
                        } catch (e) {
                            console.error('Error searching emails:', e);
                            stream.update(`Error searching emails`);
                        }
                    }
                    // Handle other tool calls here if needed
                }
            }
        } catch (error) {
            console.error('Error processing email query:', error);
            stream.update(`An error occurred`);
        } finally {
            stream.done();
        }
    })()
        
        return {
            newmessages: stream.value
        };
    }
    
    /*
if (toolResultsPromise) {
      
      
      const toolResults = await toolResultsPromise
      
      for (const toolCall of toolResults) {
          if (toolCall.toolName === 'searchEmails') {
              const { query } = toolCall.parameters
              const results = emails.filter(email => 
                email.subject.toLowerCase().includes(query.toLowerCase()) || 
                email.content.toLowerCase().includes(query.toLowerCase())
            )
            stream.update(prevValue => prevValue + `\nFound ${results.length} emails matching "${query}"`)
        } else if (toolCall.name === 'summarizeEmails') {
            const { emailIds } = toolCall.parameters
            const emailsToSummarize = emails.filter(email => emailIds.includes(email.id))
            const summaries = emailsToSummarize.map(email => `
                From: ${email.sender}
                Subject: ${email.subject}
                Summary: ${email.content.slice(0, 50)}...
                `)
                stream.update(prevValue => prevValue + `\nEmail Summaries:\n${summaries.join('\n')}`)
            } else if (toolCall.name === 'sendEmail') {
                const { to, content } = toolCall.parameters
                // Simulate sending an email
                console.log(`Sending email to ${to}: ${content}`)
                stream.update(prevValue => prevValue + `\nEmail sent to ${to}`)
            }
        }
        
        stream.done()
    }

*/