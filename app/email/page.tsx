'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Message, processEmailQuery } from '@/utils/email-actions'
import { readStreamableValue } from 'ai/rsc'
import MarkdownMessageDisplay from '@/components/MarkdownMessageDisplay'
import { Plus, Send } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Email = {
  id: number;
  sender: string;
  subject: string;
  content: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!input.trim()) return

    setInput('')
    setIsLoading(true)

    const userMessage: Message = {
      role: 'user',
      content: input
    }
    console.log(userMessage)

    setMessages(prev=> [...prev, userMessage])
    console.log(messages)


    try {
      const results = await processEmailQuery([
        ...messages.map(({ role, content }) => ({ role, content })),
        userMessage
      ])

      let assistantMessage: Message = { role: 'assistant', content: '' }

      setMessages(prev => [...prev, assistantMessage])

      for await (const chunk of readStreamableValue(results.newmessages)) {
        assistantMessage.content += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...assistantMessage }
        ])
      }

      // Update search results if applicable
   
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!replyContent.trim() || !selectedEmail) return

    const replyMessage = `Replying to ${selectedEmail.sender}: ${replyContent}`
    setMessages(prev => [...prev, { role: 'user', content: replyMessage }])
    
    setInput(`Send an email to ${selectedEmail.sender} with the content: ${replyContent}`)
    handleSubmit()
    
    setSelectedEmail(null)
    setReplyContent('')
  }

  const handleRefresh = () => {
    window.location.reload()
    setMessages([])
    setInput("")
}

  return (
    <main className="flex flex-col bg-white">
      <div className="flex-grow overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto mb-20"> {/* Added bottom margin to prevent content from being hidden behind the input */}
          <div className="flex flex-col gap-4 mb-4">
            <MarkdownMessageDisplay messages={messages} />
            {isLoading && (
              <div className="text-gray-500 italic">AI is thinking...</div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0">
        <div className="max-w-2xl mx-auto relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-7 top-1/2 transform -translate-y-1/2 size-7 rounded-full bg-background p-0"
                  onClick={handleRefresh}
                  >
                  <Plus size={16} />
                  <span className="sr-only">New Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <form className="p-4 flex items-center gap-2" onSubmit={handleSubmit}>
            <Input 
              className="flex-grow bg-white border-gray-300 pl-12" // Added left padding to accommodate the new button
              placeholder="Send a message" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" className="bg-primary text-white hover:bg-gray-800">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}



