import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, User, Bot, Trash2, StopCircle, Moon, Sun, Cpu, AlertTriangle, Terminal, MessageSquare } from 'lucide-react';

interface Message {
    role: string;
    content: string;
}

export const DeepSeekChat = () => {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings State
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant running on DeepSeek V3.2. You are precise, logical, and coding-focused.');
    const [model, setModel] = useState('deepseek-chat');
    const [temperature, setTemperature] = useState(1.0);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // --- Effects ---

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // Load from LocalStorage
    useEffect(() => {
        const savedPrompt = localStorage.getItem('ds_system_prompt');
        const savedModel = localStorage.getItem('ds_model');

        if (savedPrompt) setSystemPrompt(savedPrompt);
        if (savedModel) setModel(savedModel);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('ds_system_prompt', systemPrompt);
        localStorage.setItem('ds_model', model);
    }, [systemPrompt, model]);

    // --- Handlers ---

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setIsStreaming(true);

        // Prepare history for API
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages,
            userMessage
        ];

        abortControllerRef.current = new AbortController();

        try {
            const endpoint = '/api/deepseek/proxy';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: apiMessages,
                    stream: true,
                    temperature: temperature,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`);
            }

            if (!response.body) throw new Error('Response body is null');

            // Initialize empty assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const json = JSON.parse(line.replace('data: ', ''));
                            const content = json.choices[0]?.delta?.content || '';
                            if (content) {
                                assistantResponse += content;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1].content = assistantResponse;
                                    return newMsgs;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk', e);
                        }
                    }
                }
            }

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                setMessages(prev => [...prev, { role: 'assistant', content: '[Request Aborted by User]' }]);
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setMessages(prev => [...prev, {
                    role: 'error',
                    content: `Error: ${errorMessage}`
                }]);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            setMessages([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- Render Components ---

    const MessageContent = ({ content, role }: { content: string; role: string }) => {
        if (role === 'error') {
            return <div className="text-red-400 bg-red-900/20 p-3 rounded border border-red-500/30 whitespace-pre-wrap font-mono text-sm">{content}</div>;
        }

        // Simple code block parser
        const parts = content.split(/(```[\s\S]*?```)/g);

        return (
            <div className={`leading-relaxed ${role === 'user' ? 'text-gray-100' : 'text-gray-300'}`}>
                {parts.map((part: string, index: number) => {
                    if (part.startsWith('```') && part.endsWith('```')) {
                        const content = part.slice(3, -3);
                        const firstLineBreak = content.indexOf('\n');
                        const language = content.slice(0, firstLineBreak).trim();
                        const code = content.slice(firstLineBreak + 1);
                        return (
                            <div key={index} className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 shadow-md">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700 text-xs text-gray-400">
                                    <span className="font-mono font-bold uppercase">{language || 'CODE'}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(code)}
                                        className="hover:text-white transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-4 overflow-x-auto font-mono text-sm text-gray-300">
                                    <code>{code}</code>
                                </pre>
                            </div>
                        );
                    }
                    // Process inline code `like this`
                    return (
                        <span key={index} className="whitespace-pre-wrap">
                            {part.split(/(`[^`]+`)/g).map((subPart: string, subIndex: number) => {
                                if (subPart.startsWith('`') && subPart.endsWith('`')) {
                                    return <code key={subIndex} className="bg-gray-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono mx-0.5">{subPart.slice(1, -1)}</code>;
                                }
                                return subPart;
                            })}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#0f1117] text-gray-100 rounded-lg overflow-hidden border border-gray-700 font-sans">

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0f1117] z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Cpu size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
                            DeepSeek Chat
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-medium border border-indigo-500/30">V3.2</span>
                        </h1>
                        <p className="text-xs text-gray-400">
                            Using <span className="font-mono">{model}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Main Container */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Chat Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-[#0f1117]">
                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-40 select-none">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <Bot size={48} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">DeepSeek V3.2</h2>
                                <p className="max-w-md mx-auto mb-8">Ready to assist with reasoning, coding, and creative tasks.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full text-left">
                                    <button onClick={() => setInput("Explain the difference between DeepSeek V3 and V2")} className="p-4 rounded-xl border transition-all border-gray-800 hover:border-indigo-500 hover:bg-gray-800 text-sm">
                                        Differences in V3 vs V2?
                                    </button>
                                    <button onClick={() => setInput("Write a Python script to parse a CSV file")} className="p-4 rounded-xl border transition-all border-gray-800 hover:border-indigo-500 hover:bg-gray-800 text-sm">
                                        Python CSV Parser
                                    </button>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role !== 'user' && (
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                            {msg.role === 'error' ? <AlertTriangle size={14} className="text-white" /> : <Bot size={16} className="text-white" />}
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-gray-800 text-gray-100 rounded-bl-none'
                                        }`}>
                                        <MessageContent content={msg.content} role={msg.role} />
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                                            <User size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </main>

                {/* Settings Panel (Overlay) */}
                {showSettings && (
                    <div className="absolute top-0 right-0 h-full w-full md:w-96 shadow-2xl transform transition-transform border-l border-gray-800 z-20 overflow-y-auto bg-[#161b22]">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Settings size={20} /> Configuration
                                </h2>
                                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-300">Close</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Model</label>
                                    <select
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-900 border-gray-700 text-gray-200"
                                    >
                                        <option value="deepseek-chat">DeepSeek V3.2 (Chat)</option>
                                        <option value="deepseek-reasoner">DeepSeek R1 (Reasoner)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">System Prompt</label>
                                    <div className="relative">
                                        <textarea
                                            value={systemPrompt}
                                            onChange={(e) => setSystemPrompt(e.target.value)}
                                            rows={6}
                                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-10 resize-none bg-gray-900 border-gray-700 text-gray-200"
                                            placeholder="Enter system instructions..."
                                        />
                                        <Terminal size={16} className="absolute left-3 top-3.5 text-gray-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Temperature: {temperature}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1.5"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        className="w-full accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>Precise</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <footer className="p-4 md:p-6 border-t border-gray-800 bg-[#0f1117]">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <button
                        onClick={handleClear}
                        className="p-3 rounded-xl transition-colors bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400"
                        title="Clear Chat"
                    >
                        <Trash2 size={20} />
                    </button>

                    <div className="flex-1 flex items-end gap-2 rounded-xl border p-2 transition-all ring-offset-2 bg-gray-900 border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/50">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask DeepSeek anything..."
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-white placeholder-gray-500"
                            style={{ height: 'auto', minHeight: '44px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />

                        {isLoading ? (
                            <button
                                onClick={handleStop}
                                className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all mb-0.5"
                                title="Stop generation"
                            >
                                <StopCircle size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className={`p-2.5 rounded-lg transition-all mb-0.5 ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Send size={20} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="max-w-3xl mx-auto mt-2 text-center">
                    <p className="text-[10px] text-gray-500">AI can make mistakes. Please verify important information.</p>
                </div>
            </footer>
        </div>
    );
};
