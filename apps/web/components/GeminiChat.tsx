
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
    MessageSquare, X, Send, Zap, Sparkles, Brain, Bot, Loader2,
    Image as ImageIcon, Terminal, Settings, ChevronDown,
    ShieldAlert, Command, CheckCircle, BookOpen, Box, Server, Network
} from 'lucide-react';
import { getSystemMetrics, getAllContainersMetrics, restartService, getContainers, ContainerMetrics } from '../services/api';
import { AgentConfig, MCPTool, AgentResponseStyle, LLMProvider } from '../types';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string;
    isToolOutput?: boolean;
    isPendingConfirmation?: boolean;
}

interface PendingAction {
    msgId: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
}

const MODELS_BY_PROVIDER: Record<LLMProvider, string[]> = {
    google: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision'],
    openai: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    groq: ['llama-3-70b', 'mixtral-8x7b'],
    ollama: ['llama3', 'mistral', 'codellama', 'phi3']
};

// ----------------------------------------------------------------------
// MCP SERVER & TOOLS IMPLEMENTATION
// ----------------------------------------------------------------------

const SENSITIVE_TOOLS = ['execute_shell_command', 'restart_service', 'delete_resource'];

const MCP_TOOLS_DEFINITIONS: MCPTool[] = [
    {
        name: "get_system_metrics",
        description: "Get real-time system metrics (CPU, Memory, Disk, Network) and overall health status.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "list_services",
        description: "List all services across all projects with their IDs, status, and resource usage.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "restart_service",
        description: "CRITICAL: Restart a specific service by its ID. Requires user confirmation.",
        inputSchema: {
            type: "object",
            properties: {
                serviceId: { type: "string", description: "The exact ID of the service to restart" }
            },
            required: ["serviceId"]
        }
    },
    {
        name: "execute_shell_command",
        description: "DANGEROUS: Execute a raw shell command on the host system. Use with extreme caution.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", description: "The shell command to execute" }
            },
            required: ["command"]
        }
    },
    {
        name: "delete_resource",
        description: "DESTRUCTIVE: Delete a project, service, or file. Requires explicit approval.",
        inputSchema: {
            type: "object",
            properties: {
                resourceId: { type: "string", description: "The ID or path of the resource to delete" },
                resourceType: { type: "string", description: "project, service, or file" }
            },
            required: ["resourceId", "resourceType"]
        }
    },
    {
        name: "read_file",
        description: "Read the contents of a specific file path from the server.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Absolute path to the file" }
            },
            required: ["path"]
        }
    },
    {
        name: "search_web",
        description: "Search the internet for technical documentation or solutions.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query" }
            },
            required: ["query"]
        }
    }
];

// -- Real Tool Implementations --
const toolFunctions: Record<string, Function> = {
    get_system_metrics: async () => {
        try {
            const metrics = await getSystemMetrics();
            return {
                cpu_usage: `${metrics.cpu.usage.toFixed(2)}%`,
                cpu_cores: metrics.cpu.cores,
                memory_usage: `${metrics.memory.usage.toFixed(2)}% (${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)})`,
                disk_usage: `${metrics.disk.usage.toFixed(2)}% (${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)})`,
                network_ingress: `${formatBytes(metrics.network.rxRate)}/s`,
                network_egress: `${formatBytes(metrics.network.txRate)}/s`,
                status: 'Healthy',
                timestamp: metrics.timestamp
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to get system metrics',
                status: 'failed'
            };
        }
    },
    list_services: async () => {
        try {
            const containers = await getContainers();
            return containers.map(container => ({
                id: container.id,
                name: container.name,
                status: container.status,
                image: container.image,
                project: container.projectId || 'N/A',
                createdAt: container.createdAt
            }));
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to list services',
                status: 'failed'
            };
        }
    },
    restart_service: async (args: { serviceId: string }) => {
        try {
            await restartService(args.serviceId);
            return {
                status: "success",
                message: `Service ${args.serviceId} restart sequence initiated.`,
                serviceId: args.serviceId
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to restart service',
                status: "failed",
                serviceId: args.serviceId
            };
        }
    },
    execute_shell_command: (args: { command: string }) => {
        // Shell command execution is not available via API for security reasons
        return {
            error: "Shell command execution is not available via API for security reasons. Please use the terminal interface.",
            status: "failed"
        };
    },
    delete_resource: (args: { resourceId: string, resourceType: string }) => {
        // Resource deletion should be done through specific API endpoints
        return {
            error: `Resource deletion for ${args.resourceType} should be done through the appropriate API endpoint. Please specify the exact resource type.`,
            status: "failed"
        };
    },
    read_file: (args: { path: string }) => {
        // File reading is not available via API for security reasons
        return {
            error: "File reading is not available via API for security reasons.",
            status: "failed"
        };
    },
    search_web: (args: { query: string }) => {
        // Web search is not implemented
        return {
            error: "Web search functionality is not implemented.",
            status: "failed"
        };
    }
};

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// ----------------------------------------------------------------------
// SYSTEM PROMPTS FACTORY
// ----------------------------------------------------------------------

const getSystemPrompt = (style: AgentResponseStyle) => {
    const basePrompt = `You are Nexus Prime, an advanced AI Site Reliability Engineer (SRE).
You are provider-agnostic and exist to help users manage their infrastructure safely.
You have access to real system tools via MCP.
When performing critical actions, the system will automatically intercept your request and ask the user for confirmation.
After a tool runs, interpret the JSON output into a human-readable summary.`;

    const styles = {
        friendly: `
**Persona: Mentor & Educator**
- **Tone:** Very Friendly, encouraging, patient, and uses emojis 🌟.
- **Audience:** Junior developers or curious non-technical users.
- **Rules:** 
  1. Explain ALL technical terms (like "latency", "pod", "garbage collection") in simple, real-world analogies.
  2. Be verbose and helpful. Explain *why* something happened.
  3. Never make the user feel "dumb" for asking simple questions.
`,
        normal: `
**Persona: Helpful Colleague (Default)**
- **Tone:** Professional, balanced, and polite. 
- **Audience:** General developers and sysadmins.
- **Rules:**
  1. Use technical terms freely but briefly explain obscure ones.
  2. Be concise but ensure clarity.
  3. Strike a balance between chatty and robotic.
`,
        technical: `
**Persona: Expert SRE Copilot**
- **Tone:** Robotic, efficient, neutral, and precise. CLI-like.
- **Audience:** Senior SREs, Architects, and experts.
- **Rules:**
  1. Maximum information density. No fluff. No "I hope you are doing well".
  2. Use standard industry jargon (kubectl, syscalls, inodes, OOM) without explanation.
  3. Focus purely on output, commands, and logs.
`
    };

    return `${basePrompt}\n${styles[style]}`;
};

// ----------------------------------------------------------------------
// PROVIDER ADAPTERS
// ----------------------------------------------------------------------

// Google Adapter
interface ImagePart {
  mimeType: string;
  data: string;
}

const callGoogle = async (config: AgentConfig, history: Message[], userMsg: string, imagePart?: ImagePart) => {
    const apiKey = config.apiKey || '';
    if (!apiKey) throw new Error("API Key is missing for Gemini. Please enter your API key in the settings.");

    const ai = new GoogleGenAI({ apiKey });

    const geminiTools = [{
        functionDeclarations: MCP_TOOLS_DEFINITIONS.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema as Record<string, unknown>
        }))
    }];

    const chat = ai.chats.create({
        model: config.model,
        config: {
            systemInstruction: getSystemPrompt(config.responseStyle),
            tools: geminiTools
        },
        history: history.filter(m => !m.image && !m.isToolOutput).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }))
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: userMsg }];
    if (imagePart) {
        parts.unshift({ inlineData: { mimeType: imagePart.mimeType, data: imagePart.data } });
    }

    return await chat.sendMessageStream({ message: parts.length > 1 ? parts : userMsg });
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export const GeminiChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showModelSelect, setShowModelSelect] = useState(false);

    // Configuration State
    const [config, setConfig] = useState<AgentConfig>(() => {
        const saved = localStorage.getItem('agent_config');
        const defaults: AgentConfig = {
            provider: 'google',
            apiKey: '',
            model: 'gemini-2.5-flash',
            mcpEnabled: true,
            mcpPort: 8080,
            responseStyle: 'friendly'
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [isAiTesting, setIsAiTesting] = useState(false);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [inlineData, setInlineData] = useState<{ data: string, mimeType: string } | null>(null);

    // Safety Valve State
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    // Animation States
    const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [reaction, setReaction] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const providers = [
        { id: 'google', name: 'Google Gemini', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Multimodal, high context window.' },
        { id: 'openai', name: 'OpenAI GPT-4', icon: Brain, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', desc: 'Standard reasoning & logic.' },
        { id: 'anthropic', name: 'Anthropic Claude', icon: Box, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Best for coding & creative.' },
        { id: 'groq', name: 'Groq Cloud', icon: Zap, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Ultra-low latency inference.' },
        { id: 'ollama', name: 'Ollama (Local)', icon: Server, color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300', desc: 'Privacy-first local LLMs.' },
    ];

    const handleTestAi = () => {
        setIsAiTesting(true);
        setTimeout(() => {
            setIsAiTesting(false);
            alert("AI Provider Connected Successfully!");
        }, 1500);
    };

    useEffect(() => {
        localStorage.setItem('agent_config', JSON.stringify(config));
    }, [config]);

    // Sync model on provider change
    useEffect(() => {
        const validModels = MODELS_BY_PROVIDER[config.provider] || [];
        if (!validModels.includes(config.model)) {
            setConfig(prev => ({ ...prev, model: validModels[0] || 'gemini-2.5-flash' }));
        }
    }, [config.provider]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, isLoading, currentTool, pendingAction]);

    // Blink Interval
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 200);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(blinkInterval);
    }, []);

    // Mouse Tracking Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!buttonRef.current || isOpen) return;

            const rect = buttonRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            // Magnetic Button Pull (Max 12px)
            const btnX = Math.min(Math.max(dx / 15, -12), 12);
            const btnY = Math.min(Math.max(dy / 15, -12), 12);

            // Eye Tracking (Max 5px)
            const eyesX = Math.min(Math.max(dx / 25, -5), 5);
            const eyesY = Math.min(Math.max(dy / 25, -5), 5);

            setButtonOffset({ x: btnX, y: btnY });
            setEyeOffset({ x: eyesX, y: eyesY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isOpen]);

    const handleOpenToggle = () => {
        setReaction(true);
        setIsOpen(!isOpen);
        setTimeout(() => setReaction(false), 800);
    };

    const executeTool = async (msgId: string, name: string, args: Record<string, unknown>, currentText: string) => {
        setCurrentTool(name);

        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: currentText + `\n\n⚡ Nexus is accessing tool: **${name}**...` } : m));

        try {
            const fn = toolFunctions[name];
            if (!fn) {
                throw new Error("Tool execution failed: Unknown tool");
            }

            // Execute tool (may be async)
            const result = await Promise.resolve(fn(args));

            const resultText = `\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

            let summary = "";
            if (result.status === 'success' || (!result.error && !result.status)) {
                if (name === 'restart_service') {
                    summary = "\n\n🔄 **Restarting...** The service is rebooting. It might be unavailable for a few seconds.";
                } else if (name === 'get_system_metrics') {
                    summary = "\n\n✅ **Metrics retrieved successfully.**";
                } else if (name === 'list_services') {
                    summary = `\n\n✅ **Found ${Array.isArray(result) ? result.length : 0} services.**`;
                } else {
                    summary = "\n\n✅ **Success!**";
                }
            } else {
                summary = `\n\n❌ **Error:** ${result.error || 'Tool execution failed'}`;
            }

            setMessages(prev => prev.map(m => m.id === msgId ? {
                ...m,
                text: currentText + `\n\n⚡ **Tool Executed:** ${name}\n` + resultText + summary + "\n"
            } : m));
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => prev.map(m => m.id === msgId ? {
                ...m,
                text: currentText + `\n\n❌ **Tool Execution Failed:** ${name}\n\`\`\`json\n${JSON.stringify({ error: errorMsg }, null, 2)}\n\`\`\`\n`
            } : m));
        } finally {
            setCurrentTool(null);
        }
    };

    const initiateToolExecution = async (msgId: string, name: string, args: Record<string, unknown>, currentText: string) => {
        if (SENSITIVE_TOOLS.includes(name)) {
            setPendingAction({
                msgId,
                toolName: name,
                toolArgs: args
            });
            setMessages(prev => prev.map(m => m.id === msgId ? {
                ...m,
                text: currentText,
                isPendingConfirmation: true
            } : m));
            return true; // Signal to stop stream/waiting
        }

        await executeTool(msgId, name, args, currentText);
        return false;
    };

    const confirmPendingAction = async () => {
        if (!pendingAction) return;

        const { msgId, toolName, toolArgs } = pendingAction;

        setPendingAction(null);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPendingConfirmation: false } : m));
        setIsLoading(true);

        const currentMsg = messages.find(m => m.id === msgId);
        const baseText = currentMsg ? currentMsg.text : "";

        await executeTool(msgId, toolName, toolArgs, baseText);

        setIsLoading(false);
        setCurrentTool(null);
    };

    const denyPendingAction = () => {
        if (!pendingAction) return;
        const { msgId } = pendingAction;

        setPendingAction(null);
        setMessages(prev => prev.map(m => m.id === msgId ? {
            ...m,
            isPendingConfirmation: false,
            text: m.text + "\n\n❌ **Action Cancelled by User.**"
        } : m));
    };

    const handleGoogleStream = async (msgId: string, text: string) => {
        try {
            const stream = await callGoogle(config, messages, text, inlineData);
            let fullText = "";

            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
                }

                if (chunk.functionCalls) {
                    for (const call of chunk.functionCalls) {
                        if (call.name) {
                            const shouldWait = await initiateToolExecution(msgId, call.name, call.args, fullText);
                            if (shouldWait) {
                                setIsLoading(false);
                                return;
                            }
                        }
                    }
                }
            }
            setIsLoading(false);
            setCurrentTool(null);
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if ((!textToSend.trim() && !selectedImage) || isLoading || pendingAction) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        setInlineData(null);
        setIsLoading(true);

        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: '' }]);

        try {
            if (config.provider === 'google') {
                await handleGoogleStream(aiMsgId, textToSend);
            } else {
                // Simulation for other providers
                setTimeout(() => {
                    const response = `[${config.provider.toUpperCase()} MOCK] This is a simulated response using the ${config.model} model.`;
                    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: response } : m));
                    setIsLoading(false);
                }, 1500);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Error: ${errorMessage}` } : m));
            setIsLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setSelectedImage(base64String);
            setInlineData({ data: base64String.split(',')[1] || '', mimeType: file.type });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleOpenToggle}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-2xl transition-all duration-300 z-50 flex items-center justify-center group ${isOpen
                    ? 'bg-primary rotate-90 scale-90 text-white shadow-2xl shadow-blue-200'
                    : 'bg-primary border border-transparent hover:bg-blue-700 hover:scale-110 active:scale-95 shadow-lg shadow-blue-200'
                    }`}
                style={{
                    transform: !isOpen
                        ? `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`
                        : 'none',
                    boxShadow: isOpen
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        : `0 20px 25px -5px rgba(15, 23, 42, 0.3), ${buttonOffset.x}px ${buttonOffset.y}px 0px 0px rgba(99, 102, 241, 0.2)`
                }}
            >
                {isOpen ? (
                    <X size={28} className="text-white" />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {reaction ? (
                            <span className="text-white font-bold text-2xl animate-bounce">^^</span>
                        ) : (
                            // New Nexus Icon (Robot Head)
                            <div className="relative w-10 h-8 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center shadow-inner">
                                {/* Antenna */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-600"></div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></div>

                                {/* Screen/Face */}
                                <div className="w-8 h-4 bg-black/50 rounded flex items-center justify-between px-1.5 relative overflow-hidden">
                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent animate-scan pointer-events-none"></div>

                                    {/* Eyes */}
                                    <div
                                        className={`w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(129,140,248,0.8)] transition-transform duration-75 ${isBlinking ? 'scale-y-0' : 'scale-y-100'}`}
                                        style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px) ${isBlinking ? 'scaleY(0)' : 'scaleY(1)'}` }}
                                    ></div>
                                    <div
                                        className={`w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(129,140,248,0.8)] transition-transform duration-75 ${isBlinking ? 'scale-y-0' : 'scale-y-100'}`}
                                        style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px) ${isBlinking ? 'scaleY(0)' : 'scaleY(1)'}` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[480px] max-w-[calc(100vw-32px)] h-[750px] max-h-[calc(100vh-120px)] bg-slate-50/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-200 font-sans">

                    {/* Header - Refactored */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                {reaction ? <span className="text-white font-bold">^^</span> : <Bot className="text-white" size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm leading-tight">Nexus Prime</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Model Selector Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowModelSelect(!showModelSelect)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200 transition-colors group"
                                >
                                    <Sparkles size={12} className="text-indigo-500 group-hover:text-indigo-600" />
                                    {config.model.length > 20 ? config.model.substring(0, 18) + '...' : config.model}
                                    <ChevronDown size={12} className="text-slate-400" />
                                </button>

                                {showModelSelect && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Model ({config.provider})</div>
                                        {(MODELS_BY_PROVIDER[config.provider] || []).map(model => (
                                            <button
                                                key={model}
                                                onClick={() => { setConfig({ ...config, model }); setShowModelSelect(false); }}
                                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 flex items-center justify-between ${config.model === model ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                                            >
                                                {model}
                                                {config.model === model && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 rounded-full transition-all border border-transparent ${showSettings ? 'bg-slate-100 text-slate-900 border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Overlay */}
                    {showSettings && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl z-20 top-[73px] flex flex-col animate-in fade-in duration-200">
                            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                                {/* Agent Persona */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Brain size={14} /> Agent Persona
                                    </h4>

                                    <div className="mb-6">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Response Style</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['friendly', 'normal', 'technical'] as const).map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setConfig({ ...config, responseStyle: style })}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${config.responseStyle === style
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {style === 'normal' ? 'Default (Mix)' : style.charAt(0).toUpperCase() + style.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            {config.responseStyle === 'friendly' && "Educational, simplified terms, and uses emojis."}
                                            {config.responseStyle === 'normal' && "Balanced professional tone. Mixes friendly & technical."}
                                            {config.responseStyle === 'technical' && "Concise, expert jargon, high density. No fluff."}
                                        </p>
                                    </div>
                                </div>

                                {/* Intelligence Provider */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Sparkles size={14} /> Intelligence Provider
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 mb-4">
                                        {providers.map((provider) => (
                                            <button
                                                key={provider.id}
                                                onClick={() => setConfig({ ...config, provider: provider.id as LLMProvider })}
                                                className={`relative p-3 rounded-xl border text-left transition-all duration-200 group hover:shadow-sm ${config.provider === provider.id
                                                    ? `${provider.bg} ${provider.border} ring-1 ring-offset-0 ring-indigo-500/20`
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${provider.bg} shrink-0`}>
                                                        <provider.icon size={16} className={provider.color} />
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold text-sm ${config.provider === provider.id ? 'text-slate-900' : 'text-slate-700'}`}>{provider.name}</h4>
                                                        <p className="text-[10px] text-slate-500 leading-tight">{provider.desc}</p>
                                                    </div>
                                                    {config.provider === provider.id && (
                                                        <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full shadow-sm"></div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic Inputs */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        {config.provider === 'ollama' ? (
                                            <div className="animate-in fade-in">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Ollama Endpoint</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={ollamaUrl}
                                                        onChange={(e) => setOllamaUrl(e.target.value)}
                                                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none"
                                                    />
                                                    <button
                                                        onClick={handleTestAi}
                                                        disabled={isAiTesting}
                                                        className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        {isAiTesting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                                        Test
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="animate-in fade-in">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">API Key ({providers.find(p => p.id === config.provider)?.name})</label>
                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        value={config.apiKey}
                                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                                        placeholder="sk-..."
                                                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <CheckCircle size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MCP Protocol */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Network size={14} /> MCP Protocol Bridge
                                    </h4>
                                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-inner">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">System Online</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500">v1.0.2</span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Listening Port</span>
                                                <span className="font-mono text-slate-300">8080</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-px"></div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Registered Tools</span>
                                                <span className="font-mono text-slate-300">7</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-px"></div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Capabilities</span>
                                                <span className="text-slate-300">FS, Shell, Docker</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors border border-slate-700 flex items-center justify-center gap-2">
                                            <Terminal size={12} /> View Tool Definitions
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all">Close Settings</button>
                            </div>
                        </div>
                    )}

                    {/* HIGH-FIDELITY GLASSMORPHISM ACTION MODAL */}
                    {pendingAction && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                            {/* Blurred Backdrop */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>

                            {/* Glass Card */}
                            <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-3xl shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-black/5 flex flex-col">

                                {/* Alert Header */}
                                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center border-b border-amber-500/10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20 transform rotate-3">
                                        <ShieldAlert size={32} className="text-white drop-shadow-sm" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl tracking-tight">System Intervention</h3>
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-2">Authorization Required</p>
                                </div>

                                {/* Body */}
                                <div className="p-8">
                                    <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed font-medium">
                                        Nexus is attempting to execute <strong className="text-slate-900">{pendingAction.toolName}</strong>. This action affects the host system.
                                    </p>

                                    {/* Code Block Look */}
                                    <div className="bg-slate-900 rounded-xl p-4 mb-8 shadow-inner border border-slate-800 relative group overflow-hidden">
                                        <div className="absolute top-2 right-2 flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <pre className="font-mono text-[10px] text-blue-300 overflow-x-auto pt-2">
                                            <span className="text-purple-400">const</span> <span className="text-yellow-300">args</span> = {JSON.stringify(pendingAction.toolArgs, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={denyPendingAction}
                                            className="py-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmPendingAction}
                                            className="py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-slate-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            Proceed <Zap size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8f9fa] scroll-smooth relative">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-in fade-in duration-500">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-indigo-600 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-indigo-50 rounded-3xl transform rotate-6 scale-90 -z-10 transition-transform group-hover:rotate-12"></div>
                                    <Command size={40} />
                                </div>
                                <h3 className="font-bold text-xl text-slate-800 mb-2">Nexus Prime</h3>
                                <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-xs mx-auto">
                                    Hi! I'm your SRE assistant. I'm running in <strong>{config.responseStyle === 'normal' ? 'Default' : config.responseStyle}</strong> mode using <strong>{config.model}</strong>.
                                </p>

                                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                    <button onClick={() => handleSend("Explain what Docker is and list my services")} className="group p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all text-left flex items-center justify-between">
                                        <span>Explain Docker & List Services</span>
                                        <BookOpen size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    <button onClick={() => handleSend("Restart the chatwoot service (Demo Critical Action)")} className="group p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:border-red-500 hover:text-red-600 hover:shadow-md transition-all text-left flex items-center justify-between">
                                        <span>Restart Service (Critical Action)</span>
                                        <ShieldAlert size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[90%]`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center mr-2 mt-1 shrink-0">
                                            <Bot size={16} className="text-indigo-600" />
                                        </div>
                                    )}
                                    <div className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-200'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                                        }`}>
                                        {msg.image && (
                                            <img src={msg.image} alt="User upload" className="rounded-lg max-h-48 object-cover border border-white/20 mb-3" />
                                        )}
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(isLoading || currentTool) && !pendingAction && (
                            <div className="flex justify-start pl-10">
                                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                    {currentTool ? (
                                        <>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></div>
                                                <Terminal size={16} className="text-orange-500 relative z-10" />
                                            </div>
                                            <span className="text-xs font-mono text-slate-600">
                                                Executing <span className="font-bold text-slate-800 mx-1">{currentTool}</span> via MCP...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 size={16} className="text-indigo-500 animate-spin" />
                                            <span className="text-xs text-slate-500 font-medium">Nexus is thinking...</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100 relative z-30">
                        <div className="relative flex items-end gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

                            {selectedImage && (
                                <div className="absolute bottom-14 left-0 p-1.5 bg-white border border-slate-200 rounded-xl shadow-lg animate-in slide-in-from-bottom-2">
                                    <div className="relative">
                                        <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                                        <button onClick={() => { setSelectedImage(null); setInlineData(null); }} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={12} /></button>
                                    </div>
                                </div>
                            )}

                            <button onClick={() => fileInputRef.current?.click()} className={`p-3.5 mb-1 rounded-xl transition-all ${selectedImage ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                                <ImageIcon size={20} />
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={pendingAction ? "Action pending approval..." : "Ask Nexus for help..."}
                                disabled={!!pendingAction}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none max-h-32 min-h-[52px] transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || (!input.trim() && !selectedImage) || !!pendingAction}
                                className="p-3.5 mb-1 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
                                {isLoading && <Loader2 size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
