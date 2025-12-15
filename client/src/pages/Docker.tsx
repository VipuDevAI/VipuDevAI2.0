import { Container, Play, Terminal, Loader2, Code, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type SupportedLanguage = "javascript" | "typescript" | "python" | "go" | "rust" | "php" | "ruby" | "bash";

interface LanguageConfig {
  name: string;
  extension: string;
  color: string;
  icon: string;
  example: string;
}

const languageConfigs: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    name: "JavaScript",
    extension: ".js",
    color: "text-yellow-400",
    icon: "JS",
    example: `// Welcome to VipuDevAI Code Runner!
// JavaScript - Modern ES6+ syntax

console.log("Hello from VipuDev.AI! 💚");

// Example: Calculate factorial
const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);

console.log("Factorial of 5:", factorial(5));
console.log("Factorial of 10:", factorial(10));

// Async example
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  console.log("\\nAsync example:");
  console.log("Starting...");
  await delay(100);
  console.log("Done!");
})();
`,
  },
  typescript: {
    name: "TypeScript",
    extension: ".ts",
    color: "text-blue-400",
    icon: "TS",
    example: `// Welcome to VipuDevAI Code Runner!
// TypeScript - Type-safe JavaScript

interface User {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
};

const user: User = { name: "Vipu", age: 10 };
console.log(greet(user));

// Generic function
function identity<T>(arg: T): T {
  return arg;
}

console.log("\\nGeneric example:");
console.log(identity<string>("VipuDev.AI 💚"));
console.log(identity<number>(2024));
`,
  },
  python: {
    name: "Python",
    extension: ".py",
    color: "text-green-400",
    icon: "PY",
    example: `# Welcome to VipuDevAI Code Runner!
# Python - Clean and powerful

print("Hello from VipuDev.AI! 💚")

# Example: Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("\\nFibonacci sequence:")
for i in range(10):
    print(f"  fib({i}) = {fibonacci(i)}")

# List comprehension
squares = [x**2 for x in range(1, 6)]
print(f"\\nSquares: {squares}")

# Dictionary example
data = {"name": "Vipu", "role": "AI Assistant"}
print(f"\\n{data['name']} is a {data['role']}")
`,
  },
  go: {
    name: "Go",
    extension: ".go",
    color: "text-cyan-400",
    icon: "GO",
    example: `// Welcome to VipuDevAI Code Runner!
// Go - Fast and efficient

package main

import (
        "fmt"
)

func factorial(n int) int {
        if n <= 1 {
                return 1
        }
        return n * factorial(n-1)
}

func main() {
        fmt.Println("Hello from VipuDev.AI! 💚")
        
        // Factorial example
        fmt.Println("\\nFactorial examples:")
        for i := 1; i <= 5; i++ {
                fmt.Printf("  %d! = %d\\n", i, factorial(i))
        }
        
        // Slice example
        nums := []int{1, 2, 3, 4, 5}
        sum := 0
        for _, n := range nums {
                sum += n
        }
        fmt.Printf("\\nSum of %v = %d\\n", nums, sum)
}
`,
  },
  rust: {
    name: "Rust",
    extension: ".rs",
    color: "text-orange-400",
    icon: "RS",
    example: `// Welcome to VipuDevAI Code Runner!
// Rust - Safe and blazingly fast

fn factorial(n: u64) -> u64 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}

fn main() {
    println!("Hello from VipuDev.AI! 💚");
    
    // Factorial example
    println!("\\nFactorial examples:");
    for i in 1..=5 {
        println!("  {}! = {}", i, factorial(i));
    }
    
    // Vector example
    let nums: Vec<i32> = (1..=5).collect();
    let sum: i32 = nums.iter().sum();
    println!("\\nSum of {:?} = {}", nums, sum);
    
    // String manipulation
    let greeting = String::from("VipuDev.AI");
    println!("\\n{} has {} characters", greeting, greeting.len());
}
`,
  },
  php: {
    name: "PHP",
    extension: ".php",
    color: "text-purple-400",
    icon: "PHP",
    example: `<?php
// Welcome to VipuDevAI Code Runner!
// PHP - Popular web scripting language

echo "Hello from VipuDev.AI! 💚\\n";

// Factorial function
function factorial($n) {
    return $n <= 1 ? 1 : $n * factorial($n - 1);
}

echo "\\nFactorial examples:\\n";
for ($i = 1; $i <= 5; $i++) {
    echo "  {$i}! = " . factorial($i) . "\\n";
}

// Array example
$fruits = ["Apple", "Banana", "Cherry"];
echo "\\nFruits: " . implode(", ", $fruits) . "\\n";

// Associative array
$user = [
    "name" => "Vipu",
    "role" => "AI Assistant"
];
echo "\\n{$user['name']} is a {$user['role']}\\n";
?>
`,
  },
  ruby: {
    name: "Ruby",
    extension: ".rb",
    color: "text-red-400",
    icon: "RB",
    example: `# Welcome to VipuDevAI Code Runner!
# Ruby - Elegant and productive

puts "Hello from VipuDev.AI! 💚"

# Factorial using recursion
def factorial(n)
  n <= 1 ? 1 : n * factorial(n - 1)
end

puts "\\nFactorial examples:"
(1..5).each { |i| puts "  #{i}! = #{factorial(i)}" }

# Array operations
nums = [1, 2, 3, 4, 5]
puts "\\nSum of #{nums.inspect} = #{nums.sum}"

# Hash example
user = { name: "Vipu", role: "AI Assistant" }
puts "\\n#{user[:name]} is a #{user[:role]}"

# Block example
puts "\\nSquares:"
(1..5).map { |x| x ** 2 }.each { |s| puts "  #{s}" }
`,
  },
  bash: {
    name: "Bash",
    extension: ".sh",
    color: "text-gray-400",
    icon: "SH",
    example: `#!/bin/bash
# Welcome to VipuDevAI Code Runner!
# Bash - Unix shell scripting

echo "Hello from VipuDev.AI! 💚"

# Variables
NAME="Vipu"
echo -e "\\nWelcome, $NAME!"

# Function
factorial() {
    local n=$1
    if [ $n -le 1 ]; then
        echo 1
    else
        local prev=$(factorial $((n - 1)))
        echo $((n * prev))
    fi
}

echo -e "\\nFactorial examples:"
for i in {1..5}; do
    result=$(factorial $i)
    echo "  $i! = $result"
done

# Array
fruits=("Apple" "Banana" "Cherry")
echo -e "\\nFruits: \${fruits[*]}"

# Current date
echo -e "\\nCurrent date: $(date)"
`,
  },
};

export default function Docker() {
  const [language, setLanguage] = useState<SupportedLanguage>("javascript");
  const [code, setCode] = useState(languageConfigs.javascript.example);
  const [output, setOutput] = useState<string[]>([]);

  const runCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to run code");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const lines: string[] = [];
      lines.push(`$ Running ${language} code...`);
      lines.push("");
      
      if (data.stdout) {
        lines.push(...data.stdout.split("\n").filter((l: string) => l.trim()));
      }
      if (data.stderr) {
        lines.push("");
        lines.push("⚠️ Errors:");
        lines.push(...data.stderr.split("\n").filter((l: string) => l.trim()));
      }
      
      lines.push("");
      lines.push(`✅ Exit code: ${data.exitCode}`);
      
      setOutput(lines);
      
      if (data.success) {
        toast.success("Code executed successfully!");
      } else {
        toast.error("Code execution failed");
      }
    },
    onError: (error: any) => {
      setOutput([`❌ Error: ${error.message}`]);
      toast.error("Failed to run code");
    },
  });

  const downloadCode = () => {
    const config = languageConfigs[language];
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vipudevai-code${config.extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(languageConfigs[newLang].example);
    setOutput([]);
  };

  const currentConfig = languageConfigs[language];

  return (
    <div className="glass-card p-6 h-full flex flex-col animate-in fade-in duration-500 relative">
      <img 
        src="/vipudev-logo.png" 
        alt="VipuDev.AI Logo" 
        className="absolute top-4 right-4 w-14 h-14 object-contain opacity-80"
        data-testid="img-logo"
      />

      <div className="flex items-center justify-between mb-4 pr-16">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-lime-500/20 rounded-xl border border-lime-500/20">
            <Container className="w-6 h-6 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold vipu-gradient">Multi-Language Code Runner</h2>
            <p className="text-xs text-gray-500">Execute code in 8+ programming languages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-black/30 border border-lime-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400/50"
            data-testid="select-language"
          >
            {(Object.keys(languageConfigs) as SupportedLanguage[]).map((lang) => (
              <option key={lang} value={lang}>
                {languageConfigs[lang].name}
              </option>
            ))}
          </select>
          <button
            onClick={downloadCode}
            className="p-2 rounded-lg text-gray-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => runCodeMutation.mutate()}
            disabled={runCodeMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50"
            data-testid="button-run-code"
          >
            {runCodeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Code
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-3.5 h-3.5 text-lime-400" />
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Code Editor</label>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-black/50 border border-lime-500/20 rounded-xl p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none focus:border-lime-400/40 transition-colors"
            placeholder="Write your code here..."
            spellCheck={false}
            data-testid="textarea-code-input"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-lime-400" />
              <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Output</label>
            </div>
            {output.length > 0 && (
              <button
                onClick={clearOutput}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 bg-black/50 rounded-xl border border-lime-500/20 p-4 font-mono text-sm overflow-auto">
            {output.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Terminal className="w-10 h-10 mb-3 opacity-30" />
                <p>Click "Run Code" to execute</p>
                <p className="text-xs mt-1 text-gray-700">Output will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5 text-gray-300">
                {output.map((line, i) => (
                  <div 
                    key={i} 
                    className={
                      line.startsWith('$') ? 'text-lime-400 font-bold' : 
                      line.startsWith('✅') ? 'text-green-400' : 
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
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 p-3 rounded-xl bg-lime-500/5 border border-lime-500/15 text-xs text-gray-400">
          <strong className="text-lime-400">VipuDevAI Runner:</strong> Execute code in JavaScript, TypeScript, Python, Go, Rust, PHP, Ruby, and Bash. Code runs on the server in a sandboxed environment.
        </div>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(languageConfigs) as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                language === lang
                  ? `bg-lime-500/20 ${languageConfigs[lang].color} border border-lime-500/30`
                  : 'bg-black/30 text-gray-500 hover:text-gray-300'
              }`}
              data-testid={`button-lang-${lang}`}
            >
              {languageConfigs[lang].icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
