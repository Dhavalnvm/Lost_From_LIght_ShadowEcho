import React, { useState, useRef, useEffect } from 'react';
import { sendChat } from '../../services/api';
import type { ChatMessage } from '../../types/api';
import { Card, SectionHeader } from '../common';

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChat(text, messages);
      setMessages([...history, { role: 'assistant', content: res.response }]);
    } catch (e) {
      setMessages([...history, {
        role: 'assistant',
        content: `⚠ Error: ${e instanceof Error ? e.message : 'Request failed'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[520px] max-w-[380px] animate-fade-in">
      <SectionHeader
        title="SHADOWECHO AI"
        accent="10"
        subtitle="llama3.2:3b"
        action={
          messages.length > 0 ? (
            <button
              onClick={() => setMessages([])}
              className="text-[10px] font-mono text-text-muted hover:text-accent-red border border-bg-border hover:border-accent-red/30 px-2.5 py-1 transition-all"
            >
              ✕ Clear
            </button>
          ) : undefined
        }
      />

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 max-h-96 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-accent-cyan text-xl">◈</div>
            <div>
              <p className="text-text-secondary font-mono text-xs">ShadowEcho Analyst Assistant</p>
              <p className="text-text-muted font-mono text-[10px] mt-1">Ask about alerts, signals, or specific threats</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5 w-full mt-2">
              {[
                'What are the most critical alerts right now?',
                'Summarize recent credential leak activity',
                'What threat actors are active?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left px-3 py-2 bg-bg-elevated border border-[color:#1e3d5e] hover:border-accent-cyan shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]"
                  style={{ borderRadius: 3 }}
                >
                  <span className="font-mono text-[10px] text-text-muted hover:text-text-secondary transition-all">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2.5 font-mono text-[11px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'border-r-2 border-accent-cyan text-text-primary'
                    : 'bg-bg-elevated border border-bg-border text-text-secondary'
                }`}
                style={{ borderRadius: 4, backgroundColor: msg.role === 'user' ? '#0d1c30' : undefined }}
              >
                {msg.role === 'assistant' && (
                  <span className="text-accent-cyan text-[9px] font-semibold block mb-1 uppercase tracking-widest">◈ ShadowEcho</span>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated border border-bg-border px-4 py-3 flex items-center gap-2" style={{ borderRadius: 4 }}>
              <span className="font-mono text-[11px] text-text-muted blink">···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask the analyst assistant…"
          className="flex-1 bg-bg-elevated border border-bg-border px-3 text-text-primary font-mono text-[11px] h-[38px] focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-accent-cyan/15 border border-accent-cyan/30 hover:bg-accent-cyan/25 text-accent-cyan font-mono text-xs px-4 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↑ Send
        </button>
      </div>
    </Card>
  );
};

export default ChatPanel;
