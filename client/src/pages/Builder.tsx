import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import {
  Rocket,
  Loader2,
  FolderTree,
  FileCode,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Key,
  Sparkles,
  Zap,
  Github,
  ArrowRight,
  Palette,
  Database,
  Server,
  Layout,
  Settings,
  Code,
  Eye,
  Wand2,
  Layers,
  CheckCircle2,
  Circle,
  GraduationCap,
  ShoppingCart,
  MessageSquare,
  FileText,
  BarChart3,
  Plug,
  LayoutDashboard,
  Bot,
  User,
  Send,
  X,
  PanelRightOpen,
  PanelRightClose,
  Paperclip,
  Plus,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BuilderThread {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface BuildResponse {
  rawResponse: string;
  files: GeneratedFile[];
  fileCount: number;
  model: string;
  prompt: string;
}

const PROJECT_TEMPLATES = [
  { id: "custom", label: "Custom Project", icon: Rocket, color: "from-lime-500 to-green-500", description: "Build anything you imagine" },
  { id: "school", label: "School Management", icon: GraduationCap, color: "from-blue-500 to-cyan-500", description: "Students, teachers, classes" },
  { id: "ecommerce", label: "E-Commerce Store", icon: ShoppingCart, color: "from-purple-500 to-pink-500", description: "Products, cart, checkout" },
  { id: "chat", label: "Real-time Chat", icon: MessageSquare, color: "from-green-500 to-emerald-500", description: "Rooms, messages, users" },
  { id: "blog", label: "Blog Platform", icon: FileText, color: "from-orange-500 to-amber-500", description: "Posts, comments, categories" },
  { id: "crm", label: "CRM System", icon: BarChart3, color: "from-red-500 to-rose-500", description: "Contacts, deals, pipeline" },
  { id: "api", label: "REST API Backend", icon: Plug, color: "from-indigo-500 to-violet-500", description: "Endpoints, auth, docs" },
  { id: "dashboard", label: "Admin Dashboard", icon: LayoutDashboard, color: "from-teal-500 to-cyan-500", description: "Analytics, users, settings" },
];

const TECH_STACKS = [
  { id: "default", label: "Auto (Best Choice)", icon: Wand2, description: "Let AI choose the best stack" },
  { id: "react-node", label: "React + Node.js", icon: Server, description: "Full-stack JavaScript with PostgreSQL" },
  { id: "react-python", label: "React + FastAPI", icon: Database, description: "Python backend with async support" },
  { id: "nextjs", label: "Next.js Full-Stack", icon: Layers, description: "Server components + API routes" },
  { id: "vue-node", label: "Vue.js + Express", icon: Layout, description: "Progressive framework combo" },
  { id: "vanilla", label: "Vanilla JS", icon: Code, description: "Pure JavaScript, no frameworks" },
];

const STEPS = [
  { id: 1, title: "Blueprint", icon: Palette, description: "Choose template" },
  { id: 2, title: "Configure", icon: Settings, description: "Tech stack & details" },
  { id: 3, title: "Generate", icon: Sparkles, description: "AI builds your app" },
  { id: 4, title: "Preview", icon: Eye, description: "Review & download" },
];

const FEATURE_CHIPS = [
  "User Authentication",
  "Database CRUD",
  "REST API",
  "Real-time Updates",
  "File Uploads",
  "Search & Filter",
  "Pagination",
  "Dark Mode",
  "Responsive UI",
  "Email Notifications",
];

export default function Builder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [techStack, setTechStack] = useState("default");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vipudev_api_key") || "";
    }
    return "";
  });
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch builder threads
  const { data: threadsData } = useQuery({
    queryKey: ["builder-threads"],
    queryFn: async () => {
      const res = await fetch("/api/builder/threads");
      return res.json();
    },
  });

  const builderThreads: BuilderThread[] = threadsData?.threads || [];

  // Create new builder thread
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/builder/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Builder Chat" }),
      });
      if (!res.ok) throw new Error("Failed to create thread");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentThreadId(data.thread.id);
      setChatMessages([]);
      queryClient.invalidateQueries({ queryKey: ["builder-threads"] });
      toast.success("New conversation started!");
    },
  });

  // Load messages for current thread
  const { data: threadData } = useQuery({
    queryKey: ["builder-thread-messages", currentThreadId],
    queryFn: async () => {
      if (!currentThreadId) return null;
      const res = await fetch(`/api/builder/threads/${currentThreadId}`);
      return res.json();
    },
    enabled: !!currentThreadId,
  });

  useEffect(() => {
    if (threadData?.messages) {
      setChatMessages(
        threadData.messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    } else if (!currentThreadId) {
      setChatMessages([]);
    }
  }, [threadData, currentThreadId]);

  // Helper to save message to database
  const saveMessageToDb = async (role: string, content: string) => {
    if (!currentThreadId) return;
    try {
      await fetch("/api/builder/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content, threadId: currentThreadId }),
      });
    } catch (err) {
      console.error("Failed to save builder message:", err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const context = `You are VipuDevAI, an expert app builder assistant. Help the user refine their app requirements.
Current selections:
- Template: ${selectedTemplate}
- Tech Stack: ${techStack}
- Features: ${selectedFeatures.join(", ") || "None yet"}
- Description: ${prompt || "Not set yet"}

When the user describes what they want, help them think through:
1. Key features and functionality
2. Data models they might need
3. User flows and interactions
4. Any technical considerations

Be concise but helpful. Suggest improvements to their description.`;

      const conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: context },
            ...conversationHistory,
            { role: "user", content: userMessage }
          ],
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Chat failed");
      }

      return res.json();
    },
    onSuccess: async (data) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      await saveMessageToDb("assistant", data.reply);
      queryClient.invalidateQueries({ queryKey: ["builder-thread-messages", currentThreadId] });
      
      if (data.reply.toLowerCase().includes("suggest") || data.reply.includes("description")) {
        const match = data.reply.match(/["']([^"']{20,})["']/);
        if (match) {
          toast.info("Tip: Click on suggested text to use it as your description");
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Chat failed");
      setChatMessages(prev => prev.slice(0, -1));
    },
  });

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    
    // Auto-create thread if none selected
    let threadId = currentThreadId;
    if (!threadId) {
      try {
        const res = await fetch("/api/builder/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Builder Chat" }),
        });
        if (!res.ok) throw new Error("Failed to create thread");
        const data = await res.json();
        threadId = data.thread.id;
        setCurrentThreadId(threadId);
        queryClient.invalidateQueries({ queryKey: ["builder-threads"] });
      } catch (err) {
        toast.error("Failed to start conversation");
        setChatInput(userMessage);
        return;
      }
    }
    
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    // Save user message
    try {
      await fetch("/api/builder/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: userMessage, threadId }),
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
    }
    
    chatMutation.mutate(userMessage);
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileContents: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === "application/zip" || file.name.endsWith(".zip")) {
        fileContents.push(`[ZIP file attached: ${file.name}]`);
      } else {
        const text = await file.text();
        fileContents.push(`--- ${file.name} ---\n${text}`);
      }
    }
    const combined = fileContents.join("\n\n");
    setChatInput((prev) => prev + (prev ? "\n\n" : "") + combined);
    toast.success(`${files.length} file(s) attached!`);
    e.target.value = "";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const key = localStorage.getItem("vipudev_api_key") || "";
      setApiKey(key);
    };
    
    const handleFocus = () => {
      const key = localStorage.getItem("vipudev_api_key") || "";
      if (key !== apiKey) {
        setApiKey(key);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [apiKey]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const buildMutation = useMutation({
    mutationFn: async () => {
      const templatePrompt = selectedTemplate !== "custom" 
        ? PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.label + ": "
        : "";
      
      const featuresPrompt = selectedFeatures.length > 0
        ? `\nFeatures: ${selectedFeatures.join(", ")}`
        : "";
      
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: templatePrompt + prompt + featuresPrompt,
          techStack: techStack !== "default" ? techStack : undefined,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Build failed");
      }

      return res.json() as Promise<BuildResponse>;
    },
    onSuccess: (data) => {
      setGeneratedFiles(data.files);
      setRawResponse(data.rawResponse);
      if (data.files.length > 0) {
        setSelectedFile(data.files[0]);
        const folders = new Set<string>();
        data.files.forEach(f => {
          const parts = f.path.split("/");
          let current = "";
          parts.slice(0, -1).forEach(part => {
            current = current ? `${current}/${part}` : part;
            folders.add(current);
          });
        });
        setExpandedFolders(folders);
      }
      setCurrentStep(4);
      toast.success(`Generated ${data.fileCount} files!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Build failed");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/download-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: generatedFiles,
          projectName: prompt.slice(0, 30).replace(/[^\w\s]/g, "").replace(/\s+/g, "-") || "vipudev-project",
        }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vipudev-project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Project downloaded!");
    },
    onError: () => {
      toast.error("Download failed");
    },
  });

  const copyContent = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPath(path);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const buildFileTree = () => {
    const tree: { [key: string]: GeneratedFile[] } = {};
    const folders = new Set<string>();

    generatedFiles.forEach(file => {
      const parts = file.path.split("/");
      if (parts.length === 1) {
        if (!tree["/"]) tree["/"] = [];
        tree["/"].push(file);
      } else {
        const folder = parts.slice(0, -1).join("/");
        folders.add(folder);
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(file);
      }
    });

    return { tree, folders: Array.from(folders).sort() };
  };

  const handleStartBuild = () => {
    setCurrentStep(3);
    buildMutation.mutate();
  };

  const { tree, folders } = buildFileTree();

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-lime-500/20 border border-lime-500/20">
              <Rocket className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold vipu-gradient flex items-center gap-2">
                VipuDevAI App Builder
                <Zap className="w-4 h-4 text-yellow-400" />
              </h2>
              <p className="text-gray-500 text-xs">Generative Developer Agent - Build complete apps instantly</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {generatedFiles.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const readmeFile = generatedFiles.find(f => f.path.toLowerCase() === "readme.md");
                    if (readmeFile) {
                      setSelectedFile(readmeFile);
                    }
                    toast.success("Your project is GitHub-ready! Download and push to GitHub.");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50 transition-all text-sm font-medium"
                  data-testid="button-github-ready"
                >
                  <Github className="w-4 h-4" />
                  GitHub Ready
                </button>
                <button
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 transition-all text-sm font-medium"
                  data-testid="button-download-project"
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download ZIP
                </button>
              </>
            )}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showChat
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50"
              }`}
              data-testid="button-toggle-chat"
            >
              {showChat ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              AI Assistant
            </button>
          </div>
        </div>

        {!apiKey ? (
          <div className="rounded-xl p-4 flex items-center gap-3 mb-4 bg-amber-500/10 border border-amber-500/20">
            <Key className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div className="flex-1">
              <input
                type="password"
                id="builder-api-key-input"
                placeholder="Enter your OpenAI API key (sk-...)"
                className="w-full bg-transparent text-sm text-white placeholder:text-amber-400/60 focus:outline-none"
                data-testid="input-builder-api-key"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      const key = input.value.trim();
                      setApiKey(key);
                      localStorage.setItem("vipudev_api_key", key);
                      toast.success("API key saved!");
                    }
                  }
                }}
              />
              <p className="text-xs mt-1 text-amber-500/60">Press Enter to save. Your key is stored in browser only.</p>
            </div>
            <button
              onClick={() => {
                const input = document.getElementById("builder-api-key-input") as HTMLInputElement;
                if (input?.value.trim()) {
                  const key = input.value.trim();
                  setApiKey(key);
                  localStorage.setItem("vipudev_api_key", key);
                  toast.success("API key saved!");
                }
              }}
              className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-3 flex items-center gap-3 mb-4 bg-lime-500/10 border border-lime-500/20">
            <Key className="w-4 h-4 text-lime-400" />
            <span className="text-sm text-lime-400 flex-1">API key saved - ready to build!</span>
            <button
              onClick={() => {
                setApiKey("");
                localStorage.removeItem("vipudev_api_key");
                toast.info("API key cleared");
              }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Change Key
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-0 py-4 mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (step.id < currentStep || (step.id === 4 && generatedFiles.length > 0)) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  currentStep === step.id
                    ? "bg-lime-500/20 border border-lime-500/50"
                    : currentStep > step.id
                    ? "bg-lime-500/10 border border-lime-500/30 cursor-pointer hover:bg-lime-500/20"
                    : "bg-gray-800/30 border border-gray-700 opacity-50"
                }`}
                data-testid={`builder-step-${step.id}`}
              >
                <div className={`p-2 rounded-lg ${
                  currentStep === step.id
                    ? "bg-lime-500/30 text-lime-400"
                    : currentStep > step.id
                    ? "bg-lime-500/30 text-lime-400"
                    : "bg-gray-700/50 text-gray-500"
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id ? "text-lime-400" : currentStep > step.id ? "text-lime-400" : "text-gray-500"
                  }`}>{step.title}</p>
                  <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <ArrowRight className={`w-5 h-5 mx-2 ${currentStep > step.id ? "text-lime-400" : "text-gray-600"}`} />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-lime-400" />
                Choose Your Blueprint
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PROJECT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 rounded-xl text-left transition-all relative overflow-hidden group ${
                        selectedTemplate === template.id
                          ? "bg-gradient-to-br from-lime-500/20 to-green-500/20 border-2 border-lime-500/50"
                          : "bg-gray-800/30 border border-gray-700 hover:border-gray-600"
                      }`}
                      data-testid={`button-template-${template.id}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color} w-fit mb-2`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className={`text-sm font-medium ${selectedTemplate === template.id ? "text-lime-400" : "text-gray-300"}`}>
                        {template.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-lime-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-500 to-green-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-lime-400 hover:to-green-400 transition-all shadow-lg shadow-green-500/20"
              data-testid="button-next-configure"
            >
              Continue to Configure
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Select Tech Stack
                </h3>
                <div className="space-y-2">
                  {TECH_STACKS.map((stack) => {
                    const Icon = stack.icon;
                    return (
                      <button
                        key={stack.id}
                        onClick={() => setTechStack(stack.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                          techStack === stack.id
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : "bg-gray-800/30 border border-gray-700 hover:border-gray-600"
                        }`}
                        data-testid={`button-stack-${stack.id}`}
                      >
                        <div className={`p-2 rounded-lg ${techStack === stack.id ? "bg-blue-500/30" : "bg-gray-700/50"}`}>
                          <Icon className={`w-4 h-4 ${techStack === stack.id ? "text-blue-400" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${techStack === stack.id ? "text-blue-400" : "text-gray-300"}`}>
                            {stack.label}
                          </p>
                          <p className="text-xs text-gray-500">{stack.description}</p>
                        </div>
                        {techStack === stack.id && (
                          <Check className="w-4 h-4 text-blue-400 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Add Features (Optional)
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {FEATURE_CHIPS.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        selectedFeatures.includes(feature)
                          ? "bg-purple-500/30 text-purple-400 border border-purple-500/50"
                          : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600"
                      }`}
                      data-testid={`chip-${feature.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>

                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  Describe Your App
                </h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedTemplate === "custom"
                      ? "Describe what you want to build in detail..."
                      : "Add any specific features or customizations..."
                  }
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none h-32"
                  data-testid="input-project-prompt"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-xl bg-gray-700/50 text-gray-300 font-medium hover:bg-gray-600/50 transition-all"
                data-testid="button-back-blueprint"
              >
                Back
              </button>
              <button
                onClick={handleStartBuild}
                disabled={!apiKey || buildMutation.isPending || (!prompt && selectedTemplate === "custom")}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 font-semibold"
                data-testid="button-build"
              >
                <Sparkles className="w-5 h-5" />
                Build Application
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && buildMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lime-500/20 to-green-500/20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-lime-400 animate-spin" />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-lime-500/20 animate-ping" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Building Your Application</h3>
              <p className="text-gray-400 text-sm">AI is generating your complete project structure...</p>
            </div>
            <div className="flex gap-2">
              {["Backend", "Frontend", "Database", "API"].map((item, i) => (
                <div
                  key={item}
                  className="px-3 py-1.5 rounded-full text-xs bg-gray-800/50 text-gray-400 border border-gray-700 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentStep === 4 && generatedFiles.length > 0 && (
        <div className="flex-1 glass-card p-4 flex gap-4 min-h-0">
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-700/50 pr-4">
            <div className="flex items-center gap-2 mb-3 text-gray-400">
              <FolderTree className="w-4 h-4" />
              <span className="text-sm font-medium">Project Files ({generatedFiles.length})</span>
            </div>

            {tree["/"]?.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all ${
                  selectedFile?.path === file.path
                    ? "bg-lime-500/20 text-lime-400"
                    : "text-gray-400 hover:bg-white/5"
                }`}
                data-testid={`file-${file.path}`}
              >
                <FileCode className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}

            {folders.map((folder) => (
              <div key={folder}>
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:bg-white/5 rounded text-sm"
                >
                  {expandedFolders.has(folder) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FolderTree className="w-4 h-4 text-yellow-500" />
                  <span>{folder}</span>
                </button>
                {expandedFolders.has(folder) && (
                  <div className="ml-4">
                    {tree[folder]?.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all ${
                          selectedFile?.path === file.path
                            ? "bg-lime-500/20 text-lime-400"
                            : "text-gray-400 hover:bg-white/5"
                        }`}
                        data-testid={`file-${file.path}`}
                      >
                        <FileCode className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{file.path.split("/").pop()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-700/50 mb-3">
                  <div className="flex items-center gap-2 text-lime-400">
                    <FileCode className="w-4 h-4" />
                    <span className="text-sm font-mono">{selectedFile.path}</span>
                  </div>
                  <button
                    onClick={() => copyContent(selectedFile.content, selectedFile.path)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs text-gray-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all"
                  >
                    {copiedPath === selectedFile.path ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 rounded-lg overflow-hidden border border-gray-700/50">
                  <Editor
                    height="100%"
                    language={selectedFile.language}
                    value={selectedFile.content}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a file to view its contents</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep < 3 && generatedFiles.length === 0 && (
        <div className="flex-1 glass-card p-8 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <Sparkles className="w-20 h-20 text-lime-400/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-lime-500/20 animate-ping" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Build Anything You Imagine</h3>
          <p className="text-gray-500 max-w-lg mb-6">
            Select a template above or describe your custom project. VipuDevAI will generate 
            a complete, production-ready application with backend, frontend, database, and deployment scripts.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {[
              "School management with students, teachers, classes",
              "E-commerce with products, cart, checkout",
              "Real-time chat with rooms and messages",
              "Blog with posts, comments, categories",
              "Task manager with projects and teams",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(example);
                  setCurrentStep(2);
                }}
                className="px-4 py-2 rounded-full text-sm bg-lime-500/10 text-lime-400 border border-lime-500/20 hover:bg-lime-500/20 hover:border-lime-500/40 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed right-4 top-20 bottom-4 w-96 glass-card flex flex-col z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Build Assistant</h3>
                <p className="text-xs text-gray-500">I'll help you plan your app</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => createThreadMutation.mutate()}
                className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                title="New conversation"
                data-testid="button-builder-new-chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowThreads(!showThreads)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Chat history"
                  data-testid="button-builder-threads"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                {showThreads && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {builderThreads.length === 0 ? (
                      <div className="px-3 py-3 text-center text-gray-500 text-xs">
                        No conversations yet
                      </div>
                    ) : (
                      builderThreads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => {
                            setCurrentThreadId(thread.id);
                            setShowThreads(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                            currentThreadId === thread.id ? "bg-purple-500/10 text-purple-400" : "text-gray-400"
                          }`}
                        >
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{thread.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Bot className="w-12 h-12 text-purple-400/50 mb-3" />
                <p className="text-sm text-gray-400 mb-4">
                  Tell me about the app you want to build. I'll help you think through the features and requirements!
                </p>
                <div className="space-y-2 w-full">
                  {[
                    "I need an app for managing inventory",
                    "Help me build a booking system",
                    "What features should my blog have?",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChatInput(suggestion);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-left bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800/80 text-gray-200 border border-gray-700/50"
                    }`}
                  >
                    <div 
                      className="whitespace-pre-wrap"
                      onClick={(e) => {
                        const selection = window.getSelection()?.toString();
                        if (selection && selection.length > 10 && msg.role === "assistant") {
                          setPrompt(prev => prev ? prev + " " + selection : selection);
                          toast.success("Added to your description!");
                        }
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))
            )}

            {chatMutation.isPending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800/80 text-gray-400 rounded-xl p-3 flex items-center gap-2 border border-gray-700/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.md,.yaml,.yml,.xml,.sql,.sh,.zip"
                data-testid="input-builder-file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-purple-400 hover:border-purple-500/50 transition-all"
                title="Attach files (code, text, or ZIP)"
                data-testid="button-builder-attach"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyPress}
                placeholder="Describe your app idea..."
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                rows={2}
                data-testid="input-builder-chat"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatMutation.isPending || !apiKey}
                className="px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                data-testid="button-builder-chat-send"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {!apiKey && (
              <p className="text-xs text-amber-400 mt-2">Set your API key in Chat page first</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
