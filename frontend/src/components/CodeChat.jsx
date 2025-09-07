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
              {m.text}
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