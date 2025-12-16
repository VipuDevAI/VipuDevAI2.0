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
  Bug,
  Cloud,
  Upload,
  AlertTriangle,
  Wrench,
  RefreshCw,
  ExternalLink,
  History,
  Play,
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

interface DebugResult {
  analysis: string;
  rootCause: string;
  fixes: Array<{
    file: string;
    description: string;
    originalCode: string;
    fixedCode: string;
  }>;
  additionalSteps: string[];
  preventionTips: string[];
}

interface DeploymentConfig {
  filename: string;
  content: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  files: any[];
}

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  private: boolean;
  default_branch: string;
}

interface DeployInstructions {
  platform: string;
  steps: string[];
  configFile: string;
  configContent: string;
  deployUrl: string;
}

type MainTab = "generate" | "debug" | "deploy";

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

const DATABASE_PROVIDERS = [
  { id: "neon", label: "Neon PostgreSQL", description: "Serverless Postgres with Drizzle ORM (Recommended)" },
  { id: "supabase", label: "Supabase", description: "Postgres + Auth + Realtime" },
  { id: "planetscale", label: "PlanetScale", description: "Serverless MySQL with Prisma" },
  { id: "mongodb", label: "MongoDB Atlas", description: "NoSQL document database with Mongoose" },
  { id: "none", label: "No Database", description: "Frontend only / Mock data" },
];

export default function Builder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [techStack, setTechStack] = useState("default");
  const [databaseProvider, setDatabaseProvider] = useState("neon");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vipudev_api_key") || "";
    }
    return "";
  });
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vipudev_generated_files");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [generatedProjectName, setGeneratedProjectName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vipudev_project_name") || "";
    }
    return "";
  });
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

  // Main tab navigation
  const [mainTab, setMainTab] = useState<MainTab>("generate");

  // Debug Mode state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [errorLog, setErrorLog] = useState("");
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);

  // Deployment Center state
  const [deployPlatform, setDeployPlatform] = useState<string>("render");
  const [deployConfig, setDeployConfig] = useState<DeploymentConfig | null>(null);
  const [deployError, setDeployError] = useState("");
  const [showDeployDebug, setShowDeployDebug] = useState(false);

  // GitHub Integration state
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [deployInstructions, setDeployInstructions] = useState<DeployInstructions | null>(null);
  const [pushedRepoUrl, setPushedRepoUrl] = useState("");

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

  // Persist generated files and project name to localStorage
  useEffect(() => {
    if (generatedFiles.length > 0) {
      localStorage.setItem("vipudev_generated_files", JSON.stringify(generatedFiles));
    }
  }, [generatedFiles]);

  useEffect(() => {
    if (generatedProjectName) {
      localStorage.setItem("vipudev_project_name", generatedProjectName);
    }
  }, [generatedProjectName]);

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
          databaseProvider: databaseProvider,
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
      const projectName = prompt.slice(0, 30).replace(/[^\w\s]/g, "").replace(/\s+/g, "-") || "vipudev-project";
      setGeneratedProjectName(projectName);
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

  // Fetch all projects for Debug Mode & Deployment Center
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
  });

  const availableProjects: Project[] = projectsData?.projects || [];

  // Debug Mode mutation
  const debugMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/debug/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          errorLog,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Debug analysis failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setDebugResult(data.result);
      toast.success("Debug analysis complete!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Debug analysis failed");
    },
  });

  // Deployment config generation mutation
  const generateConfigMutation = useMutation({
    mutationFn: async () => {
      const project = availableProjects.find(p => p.id === selectedProjectId);
      const res = await fetch("/api/deployments/generate-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          platform: deployPlatform,
          projectName: project?.name || "my-app",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Config generation failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setDeployConfig(data.config);
      toast.success(`${deployPlatform} config generated!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Config generation failed");
    },
  });

  // GitHub queries
  const { data: githubStatus } = useQuery({
    queryKey: ["github-status"],
    queryFn: async () => {
      const res = await fetch("/api/github/status");
      return res.json();
    },
  });

  const { data: githubUser } = useQuery({
    queryKey: ["github-user"],
    queryFn: async () => {
      const res = await fetch("/api/github/user");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!githubStatus?.connected,
  });

  const { data: githubRepos } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const res = await fetch("/api/github/repos");
      return res.json();
    },
    enabled: !!githubStatus?.connected,
  });

  const reposList: GitHubRepo[] = githubRepos?.repos || [];

  // Create GitHub repo mutation
  const createRepoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          description: newRepoDescription || `Created with VipuDevAI - ${prompt.slice(0, 50)}`,
          isPrivate: newRepoPrivate,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create repository");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedRepo(data.repo.full_name);
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
      toast.success(`Repository "${data.repo.name}" created!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create repository");
    },
  });

  // Push to GitHub mutation
  const pushToGitHubMutation = useMutation({
    mutationFn: async () => {
      const [owner, repo] = selectedRepo.split("/");
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          files: generatedFiles.map(f => ({ path: f.path, content: f.content })),
          message: `Add VipuDevAI generated project: ${prompt.slice(0, 50)}`,
          branch: "main",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to push to GitHub");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const [owner, repo] = selectedRepo.split("/");
      setLastPushedOwnerRepo({ owner, repo });
      setPushedRepoUrl(data.repo_url);
      toast.success(`Pushed ${data.files_pushed} files to GitHub!`);
      setShowGitHubModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to push to GitHub");
    },
  });

  // Get deployment instructions
  const getDeployInstructionsMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch("/api/deploy/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          repoUrl: pushedRepoUrl,
          projectName: prompt.slice(0, 30).replace(/[^\w\s]/g, "").replace(/\s+/g, "-") || "vipudev-app",
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setDeployInstructions(data);
    },
  });

  // Deployment debug mutation
  const deployDebugMutation = useMutation({
    mutationFn: async (deploymentId: number) => {
      const res = await fetch(`/api/deployments/${deploymentId}/debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorLog: deployError,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Deployment debug failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setDebugResult(data.result);
      toast.success("Deployment issue analyzed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Deployment debug failed");
    },
  });

  // Edit code mutation - for edit & redeploy workflow
  const [changeRequest, setChangeRequest] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [lastPushedOwnerRepo, setLastPushedOwnerRepo] = useState<{owner: string, repo: string} | null>(null);

  const editCodeMutation = useMutation({
    mutationFn: async (request: string) => {
      const res = await fetch("/api/edit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: generatedFiles,
          changeRequest: request,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Code editing failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.modifiedFiles && data.modifiedFiles.length > 0) {
        // Merge modified files with existing ones
        setGeneratedFiles(prev => {
          const updated = [...prev];
          data.modifiedFiles.forEach((modified: GeneratedFile) => {
            const existingIndex = updated.findIndex(f => f.path === modified.path);
            if (existingIndex >= 0) {
              updated[existingIndex] = modified;
            } else {
              updated.push(modified);
            }
          });
          return updated;
        });
        toast.success(`Updated ${data.modifiedFiles.length} file(s)!`);
        setChangeRequest("");
      } else {
        toast.info("No files needed modification");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Code editing failed");
    },
  });

  // Push updates to GitHub (for edit & redeploy)
  const updateGitHubMutation = useMutation({
    mutationFn: async (files: GeneratedFile[]) => {
      if (!lastPushedOwnerRepo) {
        throw new Error("No repository to update. Push to GitHub first.");
      }
      
      const res = await fetch("/api/github/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: lastPushedOwnerRepo.owner,
          repo: lastPushedOwnerRepo.repo,
          files: files.map(f => ({ path: f.path, content: f.content })),
          message: `Update: ${changeRequest.slice(0, 50)}${changeRequest.length > 50 ? "..." : ""}`,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "GitHub update failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Changes pushed to GitHub! Deployment will auto-update.");
      window.open(data.commit.html_url, "_blank");
    },
    onError: (error: any) => {
      toast.error(error.message || "GitHub update failed");
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

          {/* Main Tab Navigation */}
          <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={() => setMainTab("generate")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mainTab === "generate"
                  ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              data-testid="tab-generate"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
            <button
              onClick={() => setMainTab("debug")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mainTab === "debug"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              data-testid="tab-debug"
            >
              <Bug className="w-4 h-4" />
              Debug
            </button>
            <button
              onClick={() => setMainTab("deploy")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mainTab === "deploy"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              data-testid="tab-deploy"
            >
              <Cloud className="w-4 h-4" />
              Deploy
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mainTab === "generate" && generatedFiles.length > 0 && (
              <>
                {githubStatus?.connected && (
                  <button
                    onClick={() => {
                      setNewRepoName(prompt.slice(0, 30).replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "vipudev-project");
                      setShowGitHubModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition-all text-sm font-medium"
                    data-testid="button-push-github"
                  >
                    <Github className="w-4 h-4" />
                    Push to GitHub
                  </button>
                )}
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

        {/* ============================================ */}
        {/* GENERATE TAB CONTENT */}
        {/* ============================================ */}
        {mainTab === "generate" && (
          <>
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

                <h3 className="text-sm font-semibold text-gray-300 mt-6 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Select Database
                </h3>
                <div className="space-y-2">
                  {DATABASE_PROVIDERS.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => setDatabaseProvider(db.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                        databaseProvider === db.id
                          ? "bg-cyan-500/20 border border-cyan-500/50"
                          : "bg-gray-800/30 border border-gray-700 hover:border-gray-600"
                      }`}
                      data-testid={`button-db-${db.id}`}
                    >
                      <div className={`p-2 rounded-lg ${databaseProvider === db.id ? "bg-cyan-500/30" : "bg-gray-700/50"}`}>
                        <Database className={`w-4 h-4 ${databaseProvider === db.id ? "text-cyan-400" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${databaseProvider === db.id ? "text-cyan-400" : "text-gray-300"}`}>
                          {db.label}
                        </p>
                        <p className="text-xs text-gray-500">{db.description}</p>
                      </div>
                      {databaseProvider === db.id && (
                        <Check className="w-4 h-4 text-cyan-400 ml-auto" />
                      )}
                    </button>
                  ))}
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

          {/* Edit & Redeploy Section - Only shown after project generation */}
          {pushedRepoUrl && lastPushedOwnerRepo && (
            <div className="mt-4 glass-card p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                <h4 className="font-semibold text-white">Edit & Redeploy</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">CI/CD</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Request changes below. AI will modify your code and push updates to GitHub - your deployment will auto-update!
              </p>
              <div className="flex gap-2">
                <textarea
                  value={changeRequest}
                  onChange={(e) => setChangeRequest(e.target.value)}
                  placeholder="Describe what you want to change... e.g., 'Add dark mode toggle to the header' or 'Change the primary color to blue'"
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 text-sm min-h-[60px]"
                  data-testid="textarea-edit-request"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => editCodeMutation.mutate(changeRequest)}
                  disabled={!changeRequest.trim() || editCodeMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                  data-testid="button-edit-code"
                >
                  {editCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Editing...
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4" />
                      Edit Code
                    </>
                  )}
                </button>
                <button
                  onClick={() => updateGitHubMutation.mutate(generatedFiles)}
                  disabled={updateGitHubMutation.isPending || !changeRequest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                  data-testid="button-push-updates"
                >
                  {updateGitHubMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pushing...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      Push Updates
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-lime-400" />
                Connected to: <a href={pushedRepoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lastPushedOwnerRepo.owner}/{lastPushedOwnerRepo.repo}</a>
              </div>
            </div>
          )}
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
          </>
        )}

        {/* ============================================ */}
        {/* DEBUG MODE TAB CONTENT */}
        {/* ============================================ */}
        {mainTab === "debug" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
                <Bug className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Debug Mode</h3>
                <p className="text-gray-500 text-sm">Select a project, paste your error, and let AI fix it</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Show current project if available */}
                {generatedFiles.length > 0 && (
                  <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400" />
                    <span className="text-sm text-lime-400">
                      <span className="font-semibold">{generatedProjectName || "my-project"}</span> ({generatedFiles.length} files)
                    </span>
                  </div>
                )}

                {generatedFiles.length === 0 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-400">
                      Generate a project first, then paste errors here to debug!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-orange-400" />
                    Paste Error Log
                  </label>
                  <textarea
                    value={errorLog}
                    onChange={(e) => setErrorLog(e.target.value)}
                    placeholder="Paste your error message, stack trace, or console output here..."
                    className="w-full h-64 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 font-mono text-sm"
                    data-testid="textarea-debug-error"
                  />
                </div>

                <button
                  onClick={() => {
                    if (generatedFiles.length > 0) {
                      setSelectedProjectId("current");
                    }
                    debugMutation.mutate();
                  }}
                  disabled={!errorLog.trim() || debugMutation.isPending || !apiKey}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  data-testid="button-debug-analyze"
                >
                  {debugMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-5 h-5" />
                      Analyze & Fix
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {debugResult ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Analysis
                      </h4>
                      <p className="text-gray-300 text-sm">{debugResult.analysis}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-red-400 mb-2">Root Cause</h4>
                      <p className="text-gray-300 text-sm">{debugResult.rootCause}</p>
                    </div>

                    {debugResult.fixes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-lime-400 mb-2 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Fixes
                        </h4>
                        <div className="space-y-3">
                          {debugResult.fixes.map((fix, i) => (
                            <div key={i} className="bg-gray-900/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-lime-400">{fix.file}</span>
                                <button
                                  onClick={() => copyContent(fix.fixedCode, fix.file)}
                                  className="text-xs text-gray-400 hover:text-lime-400"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{fix.description}</p>
                              <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto text-lime-300">
                                {fix.fixedCode}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {debugResult.additionalSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Additional Steps</h4>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {debugResult.additionalSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Apply Fixes & Push Button - Debug Tab */}
                    {debugResult.fixes.length > 0 && lastPushedOwnerRepo && (
                      <button
                        onClick={() => {
                          const fixedFiles = debugResult.fixes.map((fix: any) => ({
                            path: fix.file,
                            content: fix.fixedCode,
                            language: fix.file.split('.').pop() || 'text'
                          }));
                          
                          setGeneratedFiles(prev => {
                            const updated = [...prev];
                            fixedFiles.forEach((fixed: any) => {
                              const idx = updated.findIndex(f => f.path === fixed.path);
                              if (idx >= 0) {
                                updated[idx] = fixed;
                              } else {
                                updated.push(fixed);
                              }
                            });
                            return updated;
                          });
                          
                          updateGitHubMutation.mutate(fixedFiles);
                        }}
                        disabled={updateGitHubMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-medium transition-all disabled:opacity-50"
                        data-testid="button-apply-fixes-debug"
                      >
                        {updateGitHubMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Applying & Pushing...
                          </>
                        ) : (
                          <>
                            <Github className="w-5 h-5" />
                            Apply Fixes & Push to GitHub
                          </>
                        )}
                      </button>
                    )}

                    {debugResult.fixes.length > 0 && !lastPushedOwnerRepo && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                        Push your project to GitHub first (in Generate tab) to enable auto-fix & push.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <Bug className="w-16 h-16 text-orange-400/30 mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">AI-Powered Debugging</h4>
                    <p className="text-gray-500 text-sm">
                      Paste your error log and VipuDevAI will analyze it, identify the root cause, and provide specific code fixes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* DEPLOYMENT CENTER TAB CONTENT */}
        {/* ============================================ */}
        {mainTab === "deploy" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                  <Cloud className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Deployment Center</h3>
                  <p className="text-gray-500 text-sm">Push to GitHub and deploy to Render, Vercel, or Railway</p>
                </div>
              </div>
              {githubStatus?.connected && githubUser && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700">
                  <img src={githubUser.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-sm text-gray-400">@{githubUser.login}</span>
                </div>
              )}
            </div>

            {/* Step 1: GitHub Push */}
            {generatedFiles.length > 0 && githubStatus?.connected && !pushedRepoUrl && (
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-white font-semibold">Push to GitHub</h4>
                </div>
                <p className="text-gray-400 text-sm mb-4">First, push your generated project to GitHub to enable deployment.</p>
                <button
                  onClick={() => {
                    setNewRepoName(prompt.slice(0, 30).replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "vipudev-project");
                    setShowGitHubModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
                >
                  <Github className="w-5 h-5" />
                  Push to GitHub
                </button>
              </div>
            )}

            {/* Step 2: Deploy (after GitHub push) */}
            {pushedRepoUrl && (
              <div className="bg-lime-500/10 rounded-xl p-6 border border-lime-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-lime-400" />
                  <div>
                    <h4 className="text-white font-semibold">Pushed to GitHub!</h4>
                    <a href={pushedRepoUrl} target="_blank" rel="noopener noreferrer" className="text-lime-400 text-sm hover:underline flex items-center gap-1">
                      {pushedRepoUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-white font-semibold">Choose Deployment Platform</h4>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { id: "render", name: "Render", color: "from-purple-500 to-pink-500" },
                    { id: "vercel", name: "Vercel", color: "from-black to-gray-800" },
                    { id: "railway", name: "Railway", color: "from-purple-600 to-indigo-600" },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => {
                        setDeployPlatform(platform.id);
                        getDeployInstructionsMutation.mutate(platform.id);
                      }}
                      className={`p-4 rounded-xl text-center transition-all ${
                        deployPlatform === platform.id
                          ? "bg-gradient-to-br " + platform.color + " text-white border-2 border-white/30"
                          : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600"
                      }`}
                      data-testid={`button-deploy-platform-${platform.id}`}
                    >
                      <Cloud className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>

                {deployInstructions && (
                  <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-400">{deployInstructions.platform} Deployment Steps</h4>
                    <ol className="text-sm text-gray-300 space-y-1">
                      {deployInstructions.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <a
                      href={deployInstructions.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Deploy to {deployInstructions.platform}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Fallback: No generated files */}
            {generatedFiles.length === 0 && (
              <div className="bg-gray-800/30 rounded-xl p-8 text-center border border-gray-700/50">
                <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">No Project to Deploy</h4>
                <p className="text-gray-500 text-sm mb-4">Generate a project first in the Generate tab, then come back here to deploy it.</p>
                <button
                  onClick={() => setMainTab("generate")}
                  className="px-6 py-2 rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 transition-all"
                >
                  Go to Generate
                </button>
              </div>
            )}

            {/* GitHub not connected */}
            {generatedFiles.length > 0 && !githubStatus?.connected && (
              <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  <h4 className="text-white font-semibold">GitHub Not Connected</h4>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  To deploy your project, you need to connect your GitHub account first. A GitHub Personal Access Token is required.
                </p>
                <p className="text-amber-400 text-sm">
                  Please add your GitHub token in the Secrets panel to enable this feature.
                </p>
              </div>
            )}

            {/* Debug deployment failures section */}
            {showDeployDebug && pushedRepoUrl && (
              <div className="bg-orange-500/10 rounded-xl p-6 border border-orange-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Bug className="w-6 h-6 text-orange-400" />
                  <h4 className="text-white font-semibold">Deployment Failed?</h4>
                </div>
                <textarea
                  value={deployError}
                  onChange={(e) => setDeployError(e.target.value)}
                  placeholder="Paste the deployment error logs here..."
                  className="w-full h-32 bg-gray-800/50 border border-orange-500/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 font-mono text-sm mb-3"
                  data-testid="textarea-deploy-debug-error"
                />
                <button
                  onClick={() => {
                    if (deployError) {
                      setErrorLog(deployError);
                      setSelectedProjectId("current");
                      debugMutation.mutate();
                    }
                  }}
                  disabled={!deployError || debugMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all disabled:opacity-50"
                >
                  {debugMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      Analyze & Fix Deployment Issue
                    </>
                  )}
                </button>

                {debugResult && (
                  <div className="mt-4 bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <h5 className="text-sm font-semibold text-orange-400">Analysis</h5>
                    <p className="text-gray-300 text-sm">{debugResult.analysis}</p>
                    <h5 className="text-sm font-semibold text-red-400">Root Cause</h5>
                    <p className="text-gray-300 text-sm">{debugResult.rootCause}</p>
                    {debugResult.fixes.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-lime-400">Suggested Fixes</h5>
                        {debugResult.fixes.map((fix, i) => (
                          <div key={i} className="mt-2 bg-gray-900/50 rounded-lg p-3">
                            <span className="text-xs font-mono text-lime-400">{fix.file}</span>
                            <p className="text-xs text-gray-400 mt-1">{fix.description}</p>
                          </div>
                        ))}
                        
                        {/* Apply & Push button */}
                        {lastPushedOwnerRepo && (
                          <button
                            onClick={() => {
                              // Apply fixes to generated files
                              const fixedFiles = debugResult.fixes.map((fix: any) => ({
                                path: fix.file,
                                content: fix.fixedCode,
                                language: fix.file.split('.').pop() || 'text'
                              }));
                              
                              // Merge with existing files
                              setGeneratedFiles(prev => {
                                const updated = [...prev];
                                fixedFiles.forEach((fixed: any) => {
                                  const idx = updated.findIndex(f => f.path === fixed.path);
                                  if (idx >= 0) {
                                    updated[idx] = fixed;
                                  } else {
                                    updated.push(fixed);
                                  }
                                });
                                return updated;
                              });
                              
                              // Push to GitHub
                              updateGitHubMutation.mutate(fixedFiles);
                            }}
                            disabled={updateGitHubMutation.isPending}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-medium transition-all disabled:opacity-50"
                            data-testid="button-apply-fixes"
                          >
                            {updateGitHubMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Applying & Pushing...
                              </>
                            ) : (
                              <>
                                <Github className="w-4 h-4" />
                                Apply Fixes & Push to GitHub
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* GitHub Push Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-800">
                  <Github className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Push to GitHub</h3>
                  <p className="text-sm text-gray-500">
                    {githubUser?.login ? `Connected as @${githubUser.login}` : "Push your project to GitHub"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGitHubModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pushedRepoUrl ? (
              <div className="space-y-4">
                <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-lime-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-1">Successfully Pushed!</h4>
                  <a
                    href={pushedRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lime-400 hover:text-lime-300 text-sm flex items-center justify-center gap-1"
                  >
                    {pushedRepoUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400">Deploy Now</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {["render", "vercel", "railway"].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => getDeployInstructionsMutation.mutate(platform)}
                        className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-all flex flex-col items-center gap-2"
                      >
                        <Cloud className="w-5 h-5" />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {deployInstructions && (
                  <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-400">{deployInstructions.platform} Deployment</h4>
                    <ol className="text-sm text-gray-300 space-y-1">
                      {deployInstructions.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <a
                      href={deployInstructions.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Deploy to {deployInstructions.platform}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Repository
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                      data-testid="select-github-repo"
                    >
                      <option value="">Create new repository</option>
                      {reposList.map((repo) => (
                        <option key={repo.full_name} value={repo.full_name}>
                          {repo.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedRepo && (
                  <div className="space-y-3 bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400">Create New Repository</h4>
                    <input
                      type="text"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      placeholder="repository-name"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
                      data-testid="input-new-repo-name"
                    />
                    <input
                      type="text"
                      value={newRepoDescription}
                      onChange={(e) => setNewRepoDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
                      data-testid="input-new-repo-description"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={newRepoPrivate}
                        onChange={(e) => setNewRepoPrivate(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      Private repository
                    </label>
                    <button
                      onClick={() => createRepoMutation.mutate()}
                      disabled={!newRepoName || createRepoMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all disabled:opacity-50"
                      data-testid="button-create-repo"
                    >
                      {createRepoMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Create Repository
                    </button>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2">
                    <span className="font-medium text-white">{generatedFiles.length} files</span> will be pushed
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {generatedFiles.slice(0, 10).map((file) => (
                      <span key={file.path} className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300">
                        {file.path}
                      </span>
                    ))}
                    {generatedFiles.length > 10 && (
                      <span className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-400">
                        +{generatedFiles.length - 10} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => pushToGitHubMutation.mutate()}
                  disabled={!selectedRepo || pushToGitHubMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  data-testid="button-push-to-github"
                >
                  {pushToGitHubMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Pushing...
                    </>
                  ) : (
                    <>
                      <Github className="w-5 h-5" />
                      Push to GitHub
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
