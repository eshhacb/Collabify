import { useState } from 'react';
import { config } from '../config.js';

// Simple chat UI to ask questions about the current code
const CodeChat = ({ code, language }) => {
  const [messages, setMessages] = useState([]); // {role: 'user'|'ai', text}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const clearChat = () => {
    setMessages([]);
  };

  const ask = async () => {
    const question = input.trim();
    if (!question) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const resp = await fetch(`${config.API_URL}/api/ai-code-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code || '', question, language }),
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch {
        throw new Error(`Invalid JSON from server: ${text.slice(0,200)}`);
      }
      setMessages((m) => [...m, { role: 'ai', text: data.answer || '(no answer)' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: `Error: ${String(e)}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Render AI text with basic Markdown-style fenced code blocks
  const renderAIText = (text) => {
    const segments = String(text).split(/```/);
    return segments.map((seg, i) => {
      if (i % 2 === 1) {
        // Code block segment
        let lang = '';
        let body = seg;
        const nl = seg.indexOf('\n');
        if (nl !== -1) {
          const first = seg.slice(0, nl).trim();
          if (/^[A-Za-z0-9+#.\-]+$/.test(first)) {
            lang = first.toLowerCase();
            body = seg.slice(nl + 1);
          }
        } else {
          // Handle one-line form: "javascript console.log('x')"
          const m = seg.match(/^([A-Za-z0-9+#.\-]+)\s+([\s\S]*)$/);
          if (m) {
            lang = m[1].toLowerCase();
            body = m[2];
          }
        }
        return (
          <pre key={i} className="overflow-auto rounded bg-gray-900 text-gray-100 p-2 text-xs">
            <code className={`language-${lang}`}>{body}</code>
          </pre>
        );
      }
      // Normal text with inline markdown (**bold**, `code`)
      const renderInline = (s) => {
        const parts = String(s).split(/(`[^`]*`)/);
        return parts.map((part, idx) => {
          if (/^`[^`]*`$/.test(part)) {
            // Inline code span
            return <code key={idx} className="bg-gray-200 rounded px-1 py-0.5">{part.slice(1, -1)}</code>;
          }
          // Bold (**...**)
          const boldParts = part.split(/(\*\*[^*]+\*\*)/);
          return boldParts.map((bp, jdx) => {
            if (/^\*\*[^*]+\*\*$/.test(bp)) {
              return <strong key={`${idx}-${jdx}`}>{bp.slice(2, -2)}</strong>;
            }
            return <span key={`${idx}-${jdx}`}>{bp}</span>;
          });
        });
      };
      return (
        <div key={i} className="whitespace-pre-wrap text-sm text-gray-900">{renderInline(seg)}</div>
      );
    });
  };

  return (
    <div className="mt-0 border rounded-md bg-white h-full flex flex-col min-h-0">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="font-semibold text-gray-800">Ask AI about this code</div>
        <button onClick={clearChat} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Clear</button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">Ask questions like "What does this function do?", "How can I optimize this?", or "Why does this error happen?"</div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 rounded text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {m.role === 'ai' ? (
                <div className="space-y-2">{renderAIText(m.text)}</div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
          placeholder="Type your question about the code..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="px-3 py-2 bg-indigo-600 text-white rounded text-sm disabled:opacity-60"
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </div>
    </div>
  );
};

export default CodeChat;