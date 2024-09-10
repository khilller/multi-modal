'use server'

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createStreamableValue } from 'ai/rsc'
import { z } from 'zod'
import { emailList } from './email-data'

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

type ToolResult = {
    toolName: string;
    args: Record<string, any>;
}

interface Email {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    labels: string[];
}

interface Project {
    project_name: string;
    emails: Email[];
}

function formatEmail(email: Email | undefined, project: string | undefined): string {
    return `
  ### Email from ${email?.from}
  
  **Subject:** ${email?.subject}
  **To:** ${email?.to}
  **Date:** ${email?.date}
  **Project:** ${project}
  
  ${email?.body}
  ---
  `;
  }


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
          query: z.string().describe('The name of the sender'),
          project: z.string().describe('The project to search in, leave empty to search in all projects'),
          subject: z.string().describe('The subject of the email, leave empty to search in all subjects'),
          body: z.string().describe('The body of the email, leave empty to search in all bodies'),
          date: z.string().describe('The date of the email, leave empty to search in all dates'),
        }),
        execute: async ({ query, project, subject, body, date,  }) => {

            console.log(query, project);

            let searchResults: { project: string | undefined, email: Email | undefined }[] = [];


            emailList.forEach(proj => {
                if (!project || proj.project_name.toLowerCase() === project.toLowerCase()) {
                    const filteredEmails = proj.emails.filter(email => {
                      const matchQuery = query ? (
                        email.from?.toLowerCase().includes(query.toLowerCase()) ||
                        email.to?.toLowerCase().includes(query.toLowerCase()) ||
                        email.subject?.toLowerCase().includes(query.toLowerCase()) ||
                        email.body?.toLowerCase().includes(query.toLowerCase()) ||
                        email.labels?.some(label => label.toLowerCase().includes(query.toLowerCase()))
                      ) : true;
              
                      const matchSubject = subject ? email.subject?.toLowerCase().includes(subject.toLowerCase()) : true;
                      const matchBody = body ? email.body?.toLowerCase().includes(body.toLowerCase()) : true;
                      const matchDate = date ? email.date.includes(date) : true;
              
                      return matchQuery && matchSubject && matchBody && matchDate;
                    });
                    searchResults.push(...filteredEmails.map(email => ({ 
                        project: proj.project_name, 
                        email: {
                            id: email.id,
                            from: email.from,
                            to: email.to,
                            subject: email.subject,
                            body: email.body,
                            date: email.date,
                            labels: email.labels
                        } })));
                }
            })



            if (searchResults.length > 0) {
                const resultText = searchResults.map(result => formatEmail(result.email, result.project)).join('\n');
                    stream.update(`Found ${searchResults.length} email(s):\n\n${resultText}`)
            } else {
                stream.update(`No emails from ${query}`);
            }
            return searchResults;
        }

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

        stream.done();
        

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


/**
 *     try {
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
 */