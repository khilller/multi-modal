'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Message, processEmailQuery } from '@/utils/email-actions'
import { readStreamableValue } from 'ai/rsc'
import MarkdownMessageDisplay from '@/components/MarkdownMessageDisplay'

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
      if (results.searchResults) {
        setSearchResults(results.searchResults)
      }

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

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Email Chatbot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <MarkdownMessageDisplay messages={messages} />
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your emails or request a summary..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </form>
        </CardFooter>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.map(email => (
              <div key={email.id} className="mb-2 p-2 border rounded">
                <p><strong>From:</strong> {email.sender}</p>
                <p><strong>Subject:</strong> {email.subject}</p>
                <p>{email.content}</p>
                <Button onClick={() => setSelectedEmail(email)} className="mt-2">Reply</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedEmail && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Reply to {selectedEmail.sender}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReply}>
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                className="w-full mb-2"
              />
              <Button type="submit">Send Reply</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}