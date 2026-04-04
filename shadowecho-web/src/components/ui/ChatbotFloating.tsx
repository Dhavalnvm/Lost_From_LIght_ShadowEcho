import React, { useEffect, useRef, useState } from 'react';
import { Bot, SendHorizonal, X } from 'lucide-react';
import { sendChat } from '../../services/api';
import type { ChatMessage } from '../../types/api';

const quickPrompts = [
  'Summarize critical alerts',
  'Any credential leak spikes?',
  'What orgs are most mentioned?',
];

const ChatbotFloating: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const onSend = async (textInput?: string) => {
    const text = (textInput ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChat(text, messages);
      setMessages([...history, { role: 'assistant', content: response.response }]);
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: err instanceof Error ? err.message : 'Request failed' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-20 right-5 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">ShadowEcho AI</p>
                <p className="text-xs text-slate-500">Quick assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 ? (
              <div className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void onSend(prompt)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {loading ? <div className="text-sm text-slate-500">Thinking…</div> : null}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-3 border-t border-slate-200 p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && void onSend()}
              placeholder="Ask ShadowEcho AI..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => void onSend()}
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open AI chatbot"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-lg shadow-slate-300/30 transition hover:bg-blue-50"
      >
        <Bot className="h-6 w-6" />
      </button>
    </>
  );
};

export default ChatbotFloating;
