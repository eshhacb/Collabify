import { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import CodeChat from "./CodeChat.jsx";

// Monaco-based code editor with built-in JS runner using a sandboxed iframe
// Props:
// - value: string
// - onChange: (value: string) => void
// - readOnly: boolean
// - editorId: string (optional)
// - placeholder: string (optional)
const CodeEditor = ({
  value,
  onChange,
  readOnly = false,
  editorId = "code-editor",
  placeholder = "Write code here...",
}) => {
  const runnerFrameRef = useRef(null);
  const runnerContainerRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatWidth, setChatWidth] = useState(340);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(340);

  const handleMonacoChange = (val) => {
    if (readOnly) return;
    onChange?.(val ?? "");
  };

  const appendOutput = useCallback((line) => {
    setOutput((prev) => (prev ? prev + "\n" + line : line));
  }, []);

  // Clean up any existing runner frame
  const cleanupRunner = useCallback(() => {
    if (runnerFrameRef.current) {
      try {
        runnerFrameRef.current.remove();
      } catch {}
      runnerFrameRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => cleanupRunner();
  }, [cleanupRunner]);

  // Drag handlers for resizable chat panel
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = dragStartXRef.current - clientX; // dragging left increases width
      const next = Math.min(560, Math.max(260, dragStartWidthRef.current + delta));
      setChatWidth(next);
    };
    const handleUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const startDrag = (e) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartWidthRef.current = chatWidth;
    e.preventDefault();
  };

  const handleRun = async () => {
    const code = (value ?? "").toString();
    setOutput("");
    setIsRunning(true);

    if (language === "javascript") {
      // In-browser runner for JS
      // Prepare stdin lines for readLine() shim
      const inputLines = JSON.stringify((stdin || "").split(/\r?\n/));
      const escapedCodeForScript = code.replace(/<\/script>/gi, "<\\/script>");

      const onMessage = (event) => {
        const data = event?.data;
        if (!data || typeof data !== "object") return;
        if (data.type === "log") appendOutput(String(data.msg));
        if (data.type === "error") appendOutput("Error: " + String(data.msg));
        if (data.type === "done") {
          appendOutput("\n[Execution finished]");
          window.removeEventListener("message", onMessage);
          cleanupRunner();
        }
      };
      window.addEventListener("message", onMessage);

      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.style.display = "none";
      const srcdoc = `<!doctype html><html><head><meta charset=\"utf-8\" /></head><body>
        <script>
          (function(){
            const send = (type, msg) => parent.postMessage({ type, msg }, '*');
            const __input = ${inputLines};
            let __idx = 0;
            function readLine(){
              if (__idx < __input.length) return __input[__idx++];
              return undefined;
            }
            const originalLog = console.log;
            console.log = function(){
              try { send('log', Array.from(arguments).map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')); }
              catch(e){ send('log', Array.from(arguments).join(' ')); }
            };
            window.onerror = function(message, source, lineno, colno, error){
              send('error', message + ' at ' + lineno + ':' + colno);
            };
            try { ${escapedCodeForScript} } catch (e) { send('error', e && e.stack ? e.stack : String(e)); }
            send('done', 'done');
          })();
        <\\/script>
      </body></html>`;
      iframe.srcdoc = srcdoc;
      runnerFrameRef.current = iframe;
      runnerContainerRef.current?.appendChild(iframe);
      return;
    }

    // Call backend code runner for other languages
    try {
      const { config } = await import('../config.js');
      const resp = await fetch(`${config.API_URL}/api/code-runner/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch {
        throw new Error(`Invalid JSON from server: ${text.slice(0,200)}`);
      }
      const decodeEscapes = (s) =>
        typeof s === 'string'
          ? s
              .replace(/\r\n/g, '\n') // normalize CRLF
              .replace(/\\r\\n/g, '\n') // decode escaped CRLF
              .replace(/\\n/g, '\n') // decode escaped LF
              .replace(/\\t/g, '\t')
          : s;
      const stdout = decodeEscapes(data.stdout || '');
      const stderr = decodeEscapes(data.stderr || '');
      const out = stdout + (stderr ? `\n[stderr]\n${stderr}` : '');
      setOutput(out.trimEnd());
    } catch (e) {
      setOutput(`Request failed: ${String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-200">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="rust">Rust</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="markdown">Markdown</option>
          <option value="sql">SQL</option>
          <option value="shell">Shell</option>
        </select>
        <button
          onClick={handleRun}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded disabled:opacity-60"
          disabled={isRunning}
          type="button"
          title={readOnly ? "Runs without editing" : "Run the code"}
        >
          {isRunning ? "Running..." : 'Run'}
        </button>
        <button
          type="button"
          onClick={() => setShowChat((v) => !v)}
          className="ml-auto text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
          title={showChat ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      </div>

      {/* Editor + Chat side-by-side */}
      <div className="flex gap-3 h-[60vh] min-h-0 overflow-hidden">
        {/* Monaco Editor */}
        <div className="h-full border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden flex-1 min-w-0 bg-white dark:bg-gray-900">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={value}
            onChange={handleMonacoChange}
            theme="vs-dark"
            options={{
              readOnly,
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </div>
        {/* AI Chat about this code (right side) */}
        {showChat && (
          <div className="h-full min-w-0 flex" style={{ width: chatWidth }}>
            <div
              className="w-1 cursor-col-resize bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600"
              onMouseDown={startDrag}
              onTouchStart={startDrag}
            />
            <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-md">
              <CodeChat language={language} code={value || ''} />
            </div>
          </div>
        )}
      </div>

      {/* Stdin */}
      <div className="mt-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">stdin</div>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Provide input lines here (readLine() will read line by line)"
          className="w-full h-24 border border-gray-300 dark:border-gray-700 rounded-md p-2 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Output */}
      <div className="mt-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Output</div>
        <pre className="w-full h-48 overflow-auto border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-900 text-green-200 text-sm">
{output || ""}
        </pre>
      </div>

      {/* Hidden container to host the sandboxed iframe */}
      <div ref={runnerContainerRef} />
    </div>
  );
};

export default CodeEditor;