import React, { useEffect, useRef, useState } from 'react';
import { sendChat } from '../../services/api';
import type { ChatMessage } from '../../types/api';

const QUICK_PROMPTS = [
  'Summarize critical unacknowledged alerts',
  'Any credential leak spikes today?',
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
  }, [messages, open, loading]);

  const onSend = async (textInput?: string) => {
    const text = (textInput ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChat(text, messages);
      setMessages([...history, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Request failed'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed right-5 bottom-20 z-50 w-[380px] h-[520px] border border-bg-border bg-bg-card flex flex-col shadow-[0_0_30px_rgba(0,200,240,0.15)]" style={{ borderRadius: 4 }}>
          <div className="h-11 border-b border-bg-border px-3 flex items-center justify-between">
            <div>
              <p className="font-display text-sm text-text-primary">SHADOWECHO AI</p>
              <p className="font-mono text-[9px] text-text-muted">llama3.2:3b</p>
            </div>
            <button onClick={() => setOpen(false)} className="font-mono text-[11px] text-text-muted hover:text-text-primary">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="space-y-2">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => onSend(p)}
                    className="w-full text-left px-3 py-2 bg-bg-elevated border border-[#1e3d5e] shadow-[inset_0_-1px_0_rgba(0,0,0,.25)] hover:border-accent-cyan"
                    style={{ borderRadius: 3 }}
                  >
                    <span className="font-mono text-[10px] text-text-secondary">{p}</span>
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={`${m.role}-${idx}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[86%] px-3 py-2 text-[11px] font-mono leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#0d1c30] border-r-2 border-accent-cyan text-text-primary'
                        : 'bg-bg-elevated text-text-secondary'
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    {m.role === 'assistant' ? <span className="text-accent-cyan mr-1">◈</span> : null}
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                </div>
              ))
            )}
            {loading ? (
              <div className="text-text-muted font-mono text-[11px] blink">···</div>
            ) : null}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-bg-border p-3 flex gap-2">
            <input
              className="se-input !h-[38px] !py-0"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
              placeholder="Ask SHADOWECHO AI..."
            />
            <button className="btn-c !px-3" onClick={() => onSend()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open AI chatbot"
        className="fixed right-5 bottom-5 z-50 w-[52px] h-[52px] bg-bg-elevated border border-accent-cyan text-accent-cyan text-xl flex items-center justify-center shadow-[0_0_18px_rgba(0,200,240,0.35)]"
        style={{ borderWidth: 1.5, borderRadius: '999px' }}
      >
        ◈
      </button>
    </>
  );
};

export default ChatbotFloating;
