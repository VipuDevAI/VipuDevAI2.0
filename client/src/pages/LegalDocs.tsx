import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Loader2,
  Scale,
  Building2,
  User,
  Code,
  FileCheck,
  Key,
  Copy,
  Check,
  BookOpen,
  Shield,
  Stamp,
  Upload,
  FolderArchive,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertCircle,
  FileCode,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ProjectInfo {
  projectName: string;
  projectDescription: string;
  authorName: string;
  authorAddress: string;
  authorNationality: string;
  applicantName: string;
  applicantAddress: string;
  applicantType: "individual" | "company";
  companyIncorporationNumber?: string;
  dateOfCreation: string;
  sourceCodeSummary: string;
}

interface GeneratedDocument {
  title: string;
  content: string;
  type: string;
}

interface VerificationResult {
  eligible: boolean;
  projectName: string;
  description: string;
  languages: string[];
  frameworks: string[];
  fileCount: number;
  totalLines: number;
  firstPages: string;
  lastPages: string;
  suggestions: string[];
}

const DOCUMENT_TYPES = [
  { id: "form_xiv", label: "Form XIV (Copyright Application)", icon: FileText, description: "Main application form for copyright registration" },
  { id: "statement_particulars", label: "Statement of Particulars", icon: BookOpen, description: "Detailed information about the work" },
  { id: "source_code_summary", label: "Source Code Summary", icon: Code, description: "First & last 10 pages summary" },
  { id: "affidavit", label: "Affidavit of Ownership", icon: Stamp, description: "Sworn statement of ownership" },
  { id: "noc", label: "NOC Template", icon: FileCheck, description: "No Objection Certificate (if author ≠ applicant)" },
  { id: "poa", label: "Power of Attorney", icon: Shield, description: "For filing through an attorney" },
];

const STEPS = [
  { id: 1, title: "Upload Code", icon: Upload, description: "Upload your project ZIP" },
  { id: 2, title: "Verify", icon: CheckCircle2, description: "Analyze copyright eligibility" },
  { id: 3, title: "Details", icon: FileText, description: "Fill author & applicant info" },
  { id: 4, title: "Generate", icon: Sparkles, description: "Create legal documents" },
];

export default function LegalDocs() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: "",
    projectDescription: "",
    authorName: "",
    authorAddress: "",
    authorNationality: "Indian",
    applicantName: "",
    applicantAddress: "",
    applicantType: "individual",
    companyIncorporationNumber: "",
    dateOfCreation: new Date().toISOString().split("T")[0],
    sourceCodeSummary: "",
  });

  const [selectedDocs, setSelectedDocs] = useState<string[]>(["form_xiv", "statement_particulars", "source_code_summary"]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vipudev_api_key") || "";
    }
    return "";
  });

  const handleInputChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast.error("Please upload a ZIP file");
        return;
      }
      setUploadedFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleVerify = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a ZIP file first");
      return;
    }

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("/api/code/verify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Verification failed");
      }

      const data = await res.json();
      setVerificationResult(data);

      if (data.eligible) {
        setProjectInfo(prev => ({
          ...prev,
          projectName: data.projectName || prev.projectName,
          projectDescription: data.description || prev.projectDescription,
          sourceCodeSummary: `${data.firstPages}\n\n--- END OF FIRST 10 PAGES ---\n\n--- LAST 10 PAGES ---\n\n${data.lastPages}`,
        }));
        toast.success("Code verified! Your project is eligible for copyright registration.");
        setCurrentStep(3);
      } else {
        toast.error("Your project may not be eligible. See suggestions below.");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerate = async () => {
    if (!projectInfo.projectName || !projectInfo.authorName) {
      toast.error("Please fill in project name and author name");
      return;
    }

    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document type");
      return;
    }

    setIsGenerating(true);
    setGeneratedDocs([]);

    try {
      const res = await fetch("/api/legal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectInfo,
          documentTypes: selectedDocs,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate documents");
      }

      const data = await res.json();
      setGeneratedDocs(data.documents || []);
      toast.success(`Generated ${data.documents?.length || 0} legal documents!`);
      setCurrentStep(4);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate documents");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    if (generatedDocs.length === 0) {
      toast.error("No documents to export");
      return;
    }

    setIsDownloadingWord(true);
    try {
      const res = await fetch("/api/legal/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: generatedDocs,
          projectName: projectInfo.projectName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectInfo.projectName.replace(/\s+/g, "_")}_Legal_Documents.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Word document downloaded!");
    } catch (error: any) {
      toast.error(error.message || "Export failed");
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadDocument = (doc: GeneratedDocument) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${doc.title}`);
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
            <Scale className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold vipu-gradient flex items-center gap-2">
              Legal Documents Generator
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">India IP</span>
            </h2>
            <p className="text-gray-500 text-xs">Generate copyright registration documents for software in India</p>
          </div>
        </div>

        {generatedDocs.length > 0 && (
          <button
            onClick={handleDownloadWord}
            disabled={isDownloadingWord}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 transition-all text-sm font-medium shadow-lg"
            data-testid="button-download-word"
          >
            {isDownloadingWord ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download as Word
          </button>
        )}
      </div>

      {!apiKey && (
        <div className="rounded-xl p-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20">
          <Key className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            <input
              type="password"
              id="legal-api-key"
              placeholder="Enter OpenAI API key to generate documents..."
              className="w-full bg-transparent text-sm text-white placeholder:text-amber-400/60 focus:outline-none"
              data-testid="input-legal-api-key"
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
          </div>
          <button
            onClick={() => {
              const input = document.getElementById("legal-api-key") as HTMLInputElement;
              if (input?.value.trim()) {
                const key = input.value.trim();
                setApiKey(key);
                localStorage.setItem("vipudev_api_key", key);
                toast.success("API key saved!");
              }
            }}
            className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            data-testid="button-save-api-key"
          >
            Save
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-0 py-4">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (step.id <= currentStep || (step.id === 3 && verificationResult?.eligible)) {
                  setCurrentStep(step.id);
                }
              }}
              className={`flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentStep === step.id
                  ? "bg-purple-500/20 border border-purple-500/50"
                  : currentStep > step.id
                  ? "bg-lime-500/10 border border-lime-500/30 cursor-pointer hover:bg-lime-500/20"
                  : "bg-gray-800/30 border border-gray-700 opacity-50"
              }`}
              data-testid={`step-${step.id}`}
            >
              <div className={`p-2 rounded-lg ${
                currentStep === step.id
                  ? "bg-purple-500/30 text-purple-400"
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
                  currentStep === step.id ? "text-purple-400" : currentStep > step.id ? "text-lime-400" : "text-gray-500"
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
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-lg p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-4 ${
              uploadedFile
                ? "border-lime-500/50 bg-lime-500/10"
                : "border-gray-600 bg-gray-800/30 hover:border-purple-500/50 hover:bg-purple-500/10"
            }`}
            data-testid="upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
            {uploadedFile ? (
              <>
                <FolderArchive className="w-16 h-16 text-lime-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-lime-400">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setVerificationResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  data-testid="button-remove-file"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-gray-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-300">Drop your project ZIP here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            disabled={!uploadedFile}
            className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              uploadedFile
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
            data-testid="button-next-step"
          >
            Continue to Verification
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-gray-500 text-center max-w-md">
            Upload your project as a ZIP file. We'll analyze it to verify copyright eligibility 
            and extract code summaries for registration.
          </p>
        </div>
      )}

      {currentStep === 2 && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <FolderArchive className="w-10 h-10 text-purple-400" />
              <div>
                <p className="text-lg font-semibold text-white">{uploadedFile?.name}</p>
                <p className="text-sm text-gray-400">{uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) : 0} MB</p>
              </div>
            </div>

            {!verificationResult && (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 transition-all"
                data-testid="button-verify"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Code...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Verify Copyright Eligibility
                  </>
                )}
              </button>
            )}

            {verificationResult && (
              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  verificationResult.eligible
                    ? "bg-lime-500/10 border border-lime-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                }`}>
                  {verificationResult.eligible ? (
                    <CheckCircle2 className="w-6 h-6 text-lime-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${verificationResult.eligible ? "text-lime-400" : "text-red-400"}`}>
                      {verificationResult.eligible ? "Eligible for Copyright Registration" : "May Not Be Eligible"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {verificationResult.eligible
                        ? "Your project meets the requirements for software copyright registration."
                        : "Review the suggestions below to improve eligibility."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <FileCode className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                    <p className="text-lg font-bold text-white">{verificationResult.fileCount}</p>
                    <p className="text-xs text-gray-500">Files</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <Code className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-lg font-bold text-white">{verificationResult.totalLines.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Lines of Code</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <Sparkles className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
                    <p className="text-lg font-bold text-white">{verificationResult.languages.length}</p>
                    <p className="text-xs text-gray-500">Languages</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <FolderArchive className="w-5 h-5 mx-auto text-pink-400 mb-1" />
                    <p className="text-lg font-bold text-white">{verificationResult.frameworks.length}</p>
                    <p className="text-xs text-gray-500">Frameworks</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {verificationResult.languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {lang}
                    </span>
                  ))}
                  {verificationResult.frameworks.map((fw, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {fw}
                    </span>
                  ))}
                </div>

                {verificationResult.suggestions.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-400 mb-2">Suggestions:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {verificationResult.suggestions.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {verificationResult.eligible && (
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-lime-500 to-green-500 text-white hover:from-lime-400 hover:to-green-400 transition-all"
                    data-testid="button-proceed-details"
                  >
                    Proceed to Fill Details
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Code className="w-4 h-4 text-lime-400" />
              Project Details
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Project/Software Name *</label>
                <input
                  type="text"
                  value={projectInfo.projectName}
                  onChange={(e) => handleInputChange("projectName", e.target.value)}
                  placeholder="e.g., VipuDevAI Studio"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                  data-testid="input-project-name"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Project Description *</label>
                <textarea
                  value={projectInfo.projectDescription}
                  onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                  placeholder="Brief description of the software and its functionality..."
                  rows={3}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none"
                  data-testid="input-project-description"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date of Creation</label>
                <input
                  type="date"
                  value={projectInfo.dateOfCreation}
                  onChange={(e) => handleInputChange("dateOfCreation", e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400/50"
                  data-testid="input-date-creation"
                />
              </div>

              {verificationResult && (
                <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-3">
                  <p className="text-xs text-lime-400 font-medium mb-1">Auto-filled from code analysis</p>
                  <p className="text-xs text-gray-400">Source code summary extracted automatically</p>
                </div>
              )}
            </div>

            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 pt-2">
              <User className="w-4 h-4 text-blue-400" />
              Author Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Author Name *</label>
                <input
                  type="text"
                  value={projectInfo.authorName}
                  onChange={(e) => handleInputChange("authorName", e.target.value)}
                  placeholder="Full legal name of the author/developer"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                  data-testid="input-author-name"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Author Address</label>
                <textarea
                  value={projectInfo.authorAddress}
                  onChange={(e) => handleInputChange("authorAddress", e.target.value)}
                  placeholder="Complete address with PIN code"
                  rows={2}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none"
                  data-testid="input-author-address"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Author Nationality</label>
                <input
                  type="text"
                  value={projectInfo.authorNationality}
                  onChange={(e) => handleInputChange("authorNationality", e.target.value)}
                  placeholder="e.g., Indian"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                  data-testid="input-author-nationality"
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 pt-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Applicant Details (if different from author)
            </h3>

            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="radio"
                    name="applicantType"
                    checked={projectInfo.applicantType === "individual"}
                    onChange={() => handleInputChange("applicantType", "individual")}
                    className="accent-lime-400"
                    data-testid="radio-individual"
                  />
                  Individual
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="radio"
                    name="applicantType"
                    checked={projectInfo.applicantType === "company"}
                    onChange={() => handleInputChange("applicantType", "company")}
                    className="accent-lime-400"
                    data-testid="radio-company"
                  />
                  Company
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Applicant Name</label>
                <input
                  type="text"
                  value={projectInfo.applicantName}
                  onChange={(e) => handleInputChange("applicantName", e.target.value)}
                  placeholder="Leave blank if same as author"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                  data-testid="input-applicant-name"
                />
              </div>

              {projectInfo.applicantType === "company" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Company Incorporation Number (CIN)</label>
                  <input
                    type="text"
                    value={projectInfo.companyIncorporationNumber}
                    onChange={(e) => handleInputChange("companyIncorporationNumber", e.target.value)}
                    placeholder="e.g., U72200TN2020PTC123456"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                    data-testid="input-company-cin"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Applicant Address</label>
                <textarea
                  value={projectInfo.applicantAddress}
                  onChange={(e) => handleInputChange("applicantAddress", e.target.value)}
                  placeholder="Leave blank if same as author address"
                  rows={2}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none"
                  data-testid="input-applicant-address"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" />
              Select Documents to Generate
            </h3>

            <div className="space-y-2">
              {DOCUMENT_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left flex items-start gap-3 ${
                    selectedDocs.includes(doc.id)
                      ? "bg-purple-500/20 border-purple-500/50 text-white"
                      : "bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                  data-testid={`button-doc-${doc.id}`}
                >
                  <doc.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedDocs.includes(doc.id) ? "text-purple-400" : "text-gray-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    <p className="text-xs text-gray-500">{doc.description}</p>
                  </div>
                  {selectedDocs.includes(doc.id) && (
                    <Check className="w-4 h-4 text-purple-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-lime-400">Indian Copyright Registration Info</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Software is registered as "Literary Work" under Copyright Act</li>
                <li>• Form XIV is the main application form</li>
                <li>• Filing fee: Rs.500 per work</li>
                <li>• Portal: <a href="https://copyright.gov.in" target="_blank" className="text-lime-400 underline">copyright.gov.in</a></li>
                <li>• Protection: Author's lifetime + 60 years</li>
                <li>• Required: First & last 10 pages of source code</li>
              </ul>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !apiKey}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isGenerating || !apiKey
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400"
              }`}
              data-testid="button-generate-docs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Documents...
                </>
              ) : (
                <>
                  <Scale className="w-5 h-5" />
                  Generate Legal Documents
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {(currentStep === 4 || generatedDocs.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-lime-400" />
              Generated Documents ({generatedDocs.length})
            </h3>
            <button
              onClick={handleDownloadWord}
              disabled={isDownloadingWord || generatedDocs.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 transition-all text-sm font-medium disabled:opacity-50"
              data-testid="button-download-word-bottom"
            >
              {isDownloadingWord ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download All as Word (.docx)
            </button>
          </div>

          <div className="space-y-4">
            {generatedDocs.map((doc, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                  <span className="text-sm font-medium text-lime-400">{doc.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(doc.content, index)}
                      className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                      data-testid={`button-copy-doc-${index}`}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-lime-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                      data-testid={`button-download-doc-${index}`}
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <pre className="p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
                  {doc.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
