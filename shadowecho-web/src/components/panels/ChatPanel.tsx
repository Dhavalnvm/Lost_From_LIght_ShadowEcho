import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, SendHorizonal, Sparkles } from 'lucide-react';
import { sendChat } from '../../services/api';
import type { ChatMessage, ChatResponse } from '../../types/api';
import { Button, Card, SectionHeader } from '../common';

const quickPrompts = [
  'Summarize critical unacknowledged alerts',
  'What credentials were recently leaked?',
  'Describe the current threat landscape',
];

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState<ChatResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChat(text, messages);
      setLastMeta(response);
      setMessages([...history, { role: 'assistant', content: response.response }]);
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: err instanceof Error ? err.message : 'Request failed' }]);
      setLastMeta(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-[620px] flex-col">
      <SectionHeader
        title="Analyst Assistant"
        subtitle="Ask grounded questions against the live ShadowEcho intelligence context."
        accent="Chat"
        action={
          messages.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
              Clear
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">ShadowEcho Analyst Assistant</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start with a guided prompt or ask about alerts, signals, organizations, or current threat activity.
            </p>
            <div className="mt-6 grid w-full gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    ShadowEcho
                  </div>
                ) : null}
                <span className="whitespace-pre-wrap">{message.content}</span>
              </div>
            </div>
          ))
        )}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Thinking…
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {lastMeta ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {lastMeta.context_used ? <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">RAG Context Active</span> : null}
          <span>Response in {(lastMeta.duration_ms / 1000).toFixed(1)}s</span>
          <span>Powered by {lastMeta.model}</span>
        </div>
      ) : null}

      <div className="mt-auto flex gap-3 border-t border-slate-200 pt-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && void handleSend()}
          placeholder="Ask the analyst assistant..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
        <Button onClick={() => void handleSend()} disabled={!input.trim()} loading={loading}>
          <SendHorizonal className="h-4 w-4" />
          Send
        </Button>
      </div>
    </Card>
  );
};

export default ChatPanel;
