import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Code, Palette, FileCode, RefreshCw, Download, Maximize2, Minimize2, Eye, EyeOff, Loader2, Globe, FileText, Box, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

type SandboxMode = "web" | "react" | "markdown" | "svg" | "python";

interface ModeConfig {
  name: string;
  description: string;
  icon: typeof Globe;
  color: string;
}

const modeConfigs: Record<SandboxMode, ModeConfig> = {
  web: {
    name: "Web",
    description: "HTML, CSS & JavaScript",
    icon: Globe,
    color: "text-orange-400",
  },
  react: {
    name: "React",
    description: "JSX with live preview",
    icon: Code,
    color: "text-cyan-400",
  },
  markdown: {
    name: "Markdown",
    description: "Markdown to HTML preview",
    icon: FileText,
    color: "text-purple-400",
  },
  svg: {
    name: "SVG",
    description: "SVG graphics preview",
    icon: Box,
    color: "text-pink-400",
  },
  python: {
    name: "Python",
    description: "Run Python with output",
    icon: Terminal,
    color: "text-green-400",
  },
};

const defaultContent: Record<SandboxMode, { code: string; css?: string }> = {
  web: {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VipuDev.AI Sandbox</title>
</head>
<body>
  <div class="container">
    <h1>Welcome to VipuDev.AI!</h1>
    <p>Edit HTML, CSS & JavaScript to see live preview</p>
    <button id="btn">Click Me!</button>
    <div id="output"></div>
  </div>
  <script>
    let count = 0;
    document.getElementById('btn').addEventListener('click', () => {
      count++;
      document.getElementById('output').textContent = 
        'Clicked ' + count + ' time' + (count === 1 ? '' : 's') + '! 🎉';
    });
  </script>
</body>
</html>`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.container {
  text-align: center;
  padding: 40px;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  border: 1px solid rgba(132, 204, 22, 0.3);
  backdrop-filter: blur(10px);
}

h1 {
  background: linear-gradient(90deg, #22c55e, #84cc16);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

p { color: #888; margin-bottom: 20px; }

button {
  background: linear-gradient(90deg, #22c55e, #84cc16);
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(132, 204, 22, 0.3);
}

#output {
  margin-top: 20px;
  font-size: 24px;
  color: #84cc16;
}`,
  },
  react: {
    code: `// React JSX - Live Preview
// This runs in a simulated React environment

function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px',
        border: '1px solid rgba(132, 204, 22, 0.3)',
        color: 'white'
      }}>
        <h1 style={{
          background: 'linear-gradient(90deg, #22c55e, #84cc16)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px'
        }}>
          React in VipuDev.AI! 🚀
        </h1>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Edit the JSX code to see live changes
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            background: 'linear-gradient(90deg, #22c55e, #84cc16)',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));`,
  },
  markdown: {
    code: `# Welcome to VipuDev.AI Markdown! 📝

This is a **live Markdown preview** sandbox.

## Features

- ✅ Real-time preview
- ✅ GitHub-flavored Markdown
- ✅ Syntax highlighting
- ✅ Download as HTML

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello from VipuDev.AI! 💚");
}
\`\`\`

## Table Example

| Feature | Status |
|---------|--------|
| Live Preview | ✅ |
| Export | ✅ |
| Syntax Highlight | ✅ |

## Quote

> "Code with heart, ship with power" - VipuDev.AI

---

Made with 💚 by **VipuDev.AI**`,
  },
  svg: {
    code: `<!-- SVG Graphics Preview -->
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e"/>
      <stop offset="100%" style="stop-color:#84cc16"/>
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Logo Circle -->
  <circle cx="200" cy="120" r="50" fill="url(#greenGrad)" opacity="0.8">
    <animate attributeName="r" values="50;55;50" dur="2s" repeatCount="indefinite"/>
  </circle>
  
  <!-- V Letter -->
  <text x="200" y="135" text-anchor="middle" fill="white" font-size="48" font-weight="bold">V</text>
  
  <!-- Title -->
  <text x="200" y="200" text-anchor="middle" fill="url(#greenGrad)" font-size="24" font-weight="bold">
    VipuDev.AI
  </text>
  
  <!-- Subtitle -->
  <text x="200" y="230" text-anchor="middle" fill="#888" font-size="12">
    SHORT. SHARP. EXECUTE...
  </text>
  
  <!-- Decorative circles -->
  <circle cx="50" cy="50" r="20" fill="#22c55e" opacity="0.2">
    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="350" cy="250" r="30" fill="#84cc16" opacity="0.15">
    <animate attributeName="opacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite"/>
  </circle>
</svg>`,
  },
  python: {
    code: `# Python Live Sandbox
# Write Python code and see the output below

print("Hello from VipuDev.AI! 💚")
print()

# Example: Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"  fib({i}) = {fibonacci(i)}")

# List comprehension
squares = [x**2 for x in range(1, 6)]
print(f"\\nSquares: {squares}")

# Dictionary example
data = {"name": "Vipu", "role": "AI Assistant"}
print(f"\\n{data['name']} is a {data['role']}")`,
  },
};

export default function Sandbox() {
  const [mode, setMode] = useState<SandboxMode>("web");
  const [code, setCode] = useState(defaultContent.web.code);
  const [css, setCss] = useState(defaultContent.web.css || "");
  const [activeTab, setActiveTab] = useState<"code" | "css">("code");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pythonOutput, setPythonOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPythonMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to run code");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const lines: string[] = [];
      if (data.stdout) {
        lines.push(...data.stdout.split("\n"));
      }
      if (data.stderr) {
        lines.push("", "⚠️ Errors:", ...data.stderr.split("\n"));
      }
      setPythonOutput(lines);
      if (data.success) {
        toast.success("Python executed successfully!");
      }
    },
    onError: (error: any) => {
      setPythonOutput([`❌ Error: ${error.message}`]);
      toast.error("Failed to run Python code");
    },
  });

  const generatePreview = useCallback(() => {
    if (mode === "python") {
      runPythonMutation.mutate();
      return;
    }

    let doc = "";

    if (mode === "web") {
      doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${code.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*?<\/head>/g, '').replace(/<\/?body>/g, '')}
</body>
</html>`;
    } else if (mode === "react") {
      doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
  </script>
</body>
</html>`;
    } else if (mode === "markdown") {
      const htmlContent = simpleMarkdownToHtml(code);
      doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      padding: 40px;
      color: #e0e0e0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255,255,255,0.05);
      padding: 40px;
      border-radius: 20px;
      border: 1px solid rgba(132, 204, 22, 0.3);
    }
    h1, h2, h3 { color: #84cc16; margin: 20px 0 10px; }
    h1 { font-size: 2em; border-bottom: 2px solid rgba(132, 204, 22, 0.3); padding-bottom: 10px; }
    h2 { font-size: 1.5em; }
    p { margin: 10px 0; line-height: 1.6; }
    ul, ol { margin: 10px 0 10px 20px; }
    li { margin: 5px 0; }
    code { background: rgba(132, 204, 22, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; overflow-x: auto; margin: 15px 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #84cc16; padding-left: 20px; margin: 15px 0; color: #888; font-style: italic; }
    table { border-collapse: collapse; margin: 15px 0; width: 100%; }
    th, td { border: 1px solid rgba(132, 204, 22, 0.3); padding: 10px; text-align: left; }
    th { background: rgba(132, 204, 22, 0.2); }
    hr { border: none; border-top: 1px solid rgba(132, 204, 22, 0.3); margin: 20px 0; }
    a { color: #84cc16; }
    strong { color: #22c55e; }
  </style>
</head>
<body>
  <div class="container">${htmlContent}</div>
</body>
</html>`;
    } else if (mode === "svg") {
      doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
    }
    svg { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    if (iframeRef.current) {
      iframeRef.current.srcdoc = doc;
    }
  }, [code, css, mode]);

  const simpleMarkdownToHtml = (md: string): string => {
    let html = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^---$/gim, '<hr>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/^(?!<[hluob]|<li|<hr)(.*$)/gim, (match, p1) => p1.trim() ? `<p>${p1}</p>` : '');

    html = html.replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

    const tableRegex = /\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/gim;
    html = html.replace(tableRegex, (match, header, body) => {
      const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    return html;
  };

  useEffect(() => {
    if (!autoRefresh || mode === "python") return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, css, autoRefresh, generatePreview, mode]);

  const handleModeChange = (newMode: SandboxMode) => {
    setMode(newMode);
    setCode(defaultContent[newMode].code);
    setCss(defaultContent[newMode].css || "");
    setActiveTab("code");
    setPythonOutput([]);
  };

  const downloadProject = () => {
    let content = "";
    let filename = "";
    let type = "text/html";

    if (mode === "web") {
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VipuDev.AI Project</title>
  <style>${css}</style>
</head>
<body>
${code.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*?<\/head>/g, '').replace(/<\/?body>/g, '')}
</body>
</html>`;
      filename = "vipudevai-project.html";
    } else if (mode === "react") {
      content = code;
      filename = "vipudevai-react.jsx";
      type = "text/javascript";
    } else if (mode === "markdown") {
      content = code;
      filename = "vipudevai-document.md";
      type = "text/markdown";
    } else if (mode === "svg") {
      content = code;
      filename = "vipudevai-graphic.svg";
      type = "image/svg+xml";
    } else if (mode === "python") {
      content = code;
      filename = "vipudevai-script.py";
      type = "text/x-python";
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const currentConfig = modeConfigs[mode];
  const showCssTab = mode === "web";

  return (
    <div className={`glass-card p-4 h-full flex flex-col animate-in fade-in duration-500 ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-lime-500/20 rounded-xl border border-lime-500/20">
            <Play className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold vipu-gradient">Multi-Mode Sandbox</h2>
            <p className="text-xs text-gray-500">{currentConfig.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
            {(Object.keys(modeConfigs) as SandboxMode[]).map((m) => {
              const config = modeConfigs[m];
              const Icon = config.icon;
              return (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mode === m
                      ? 'bg-lime-500/20 text-white border border-lime-500/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title={config.description}
                  data-testid={`button-mode-${m}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${mode === m ? config.color : ''}`} />
                  {config.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-3">
        {mode !== "python" && (
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-all ${autoRefresh ? 'bg-lime-500/20 text-lime-400' : 'bg-gray-800 text-gray-500'}`}
            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
          </button>
        )}
        <button
          onClick={() => setPreviewVisible(!previewVisible)}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
          title={previewVisible ? "Hide preview" : "Show preview"}
        >
          {previewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          onClick={generatePreview}
          disabled={mode === "python" && runPythonMutation.isPending}
          className="px-4 py-2 rounded-lg bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
        >
          {mode === "python" && runPythonMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run
        </button>
        <button
          onClick={downloadProject}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-lime-400 transition-all"
          title="Download project"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className={`flex-1 flex gap-3 min-h-0 ${!previewVisible ? 'flex-col' : ''}`}>
        <div className={`flex flex-col ${previewVisible ? 'w-1/2' : 'flex-1'}`}>
          {showCssTab && (
            <div className="flex gap-1 mb-2 bg-black/30 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "code"
                    ? 'bg-lime-500/20 text-white border border-lime-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <FileCode className={`w-4 h-4 ${activeTab === "code" ? 'text-orange-400' : ''}`} />
                HTML
              </button>
              <button
                onClick={() => setActiveTab("css")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "css"
                    ? 'bg-lime-500/20 text-white border border-lime-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Palette className={`w-4 h-4 ${activeTab === "css" ? 'text-blue-400' : ''}`} />
                CSS
              </button>
            </div>
          )}

          {!showCssTab && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <currentConfig.icon className={`w-4 h-4 ${currentConfig.color}`} />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                {currentConfig.name} Editor
              </span>
            </div>
          )}

          <textarea
            value={showCssTab && activeTab === "css" ? css : code}
            onChange={(e) => {
              if (showCssTab && activeTab === "css") {
                setCss(e.target.value);
              } else {
                setCode(e.target.value);
              }
            }}
            className="flex-1 bg-black/50 border border-lime-500/20 rounded-xl p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none focus:border-lime-400/40 transition-colors"
            spellCheck={false}
            placeholder={`Write ${currentConfig.name} code here...`}
            data-testid="textarea-sandbox"
          />
        </div>

        {previewVisible && (
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500 ml-2">
                {mode === "python" ? "Output" : "Live Preview"}
              </span>
            </div>
            {mode === "python" ? (
              <div className="flex-1 bg-black/50 rounded-xl overflow-auto border border-lime-500/20 p-4 font-mono text-sm">
                {pythonOutput.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <Terminal className="w-10 h-10 mb-3 opacity-30" />
                    <p>Click "Run" to execute Python</p>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-gray-300">
                    {pythonOutput.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.startsWith('❌') ? 'text-red-400' :
                          line.startsWith('⚠️') ? 'text-amber-400' :
                          ''
                        }
                      >
                        {line || '\u00A0'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-xl overflow-hidden border border-lime-500/20">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-modals"
                  title="Preview"
                  data-testid="iframe-preview"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
