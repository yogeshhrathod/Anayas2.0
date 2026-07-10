import { AlertTriangle, Bot, Send, User, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { useStore } from '../store/useStore';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function AgenticRunner() {
  const { aiEndpoint, aiModel, aiPassword } = useStore(state => ({
    aiEndpoint: state.aiEndpoint || 'http://127.0.0.1:1234',
    aiModel: state.aiModel || 'qwen/qwen3.5-9b',
    aiPassword: state.aiPassword || '',
  }));

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am Luna, your Agentic API Runner. How can I help you test or sequence APIs today?',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showError } = useToastNotifications();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    const userMessage: Message = { role: 'user', content: inputVal };
    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsGenerating(true);

    try {
      const url = `${aiEndpoint.replace(/\/$/, '')}/v1/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (aiPassword) {
        headers['Authorization'] = `Bearer ${aiPassword}`;
      }

      const payload = {
        model: aiModel,
        messages: [
          {
            role: 'system',
            content:
              'You are Luna, a highly capable API testing agent. You assist the user with drafting JSON payloads, explaining Swagger specs, and writing curl commands.',
          },
          ...messages,
          userMessage,
        ],
        stream: false,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ]);
    } catch (e: any) {
      console.error('AgenticRunner Error:', e);
      showError(
        'Agent Error',
        e.message || 'Failed to communicate with local AI server.'
      );
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ Could not reach the local AI engine. Make sure your local server (e.g., LM Studio, Ollama) is running at ' +
            aiEndpoint,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Luna Agentic Runner</h1>
          <p className="text-sm text-muted-foreground">
            Local model: {aiModel} via {aiEndpoint}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-lg shadow-sm">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg text-sm whitespace-pre-wrap flex-1 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-foreground border border-border/50'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm flex gap-1 items-center">
                <span className="animate-bounce">.</span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                >
                  .
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-card/50">
          <div className="relative flex items-center gap-2">
            <Input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luna to test an endpoint, generate a payload, or find edge cases..."
              className="flex-1 h-12 pr-12 text-sm shadow-sm"
              disabled={isGenerating}
            />
            <Button
              size="icon"
              className="absolute right-2 h-8 w-8"
              onClick={handleSend}
              disabled={!inputVal.trim() || isGenerating}
            >
              <Send className="h-4 w-4 py-[1px] pr-[1px]" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex gap-4">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" /> On-Demand Execution
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" /> Destructive
              actions require approval
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
