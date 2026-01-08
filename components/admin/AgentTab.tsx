import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Sparkles, Bot, User, Loader2, Image as ImageIcon, X, Trash2, RefreshCw, Mic, MicOff, Check, AlertCircle, Menu, Terminal, BookOpen } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProduct, useOrder } from '@/contexts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';

interface Message {
    role: 'user' | 'model';
    text: string;
    images?: string[];
    imageGeneration?: {
        base64: string;
        prompt: string;
    };
}

// Helper functions for audio encoding/decoding
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const TOOL_DEFINITIONS = [
    { name: 'listProducts', template: 'listProducts({ page: 1, limit: 20 })', description: 'List products with pagination (page, limit, search, category).' },
    { name: 'listOrders', template: 'listOrders({ page: 1, limit: 20 })', description: 'List orders (status, search, page, limit).' },
    { name: 'listCustomers', template: 'listCustomers({ page: 1, limit: 20 })', description: 'List customers (search, page, limit).' },
    { name: 'listCoupons', template: 'listCoupons({ page: 1, limit: 20 })', description: 'List coupons (search, activeOnly, page, limit).' },
    { name: 'createProduct', template: 'createProduct({ name: "", price: 0, category: "", stock: 0 })', description: 'Create a new product.' },
    { name: 'updateProduct', template: 'updateProduct({ id: 0, stock: 0 })', description: 'Update a product.' },
    { name: 'getSiteStats', template: 'getSiteStats({})', description: 'Get dashboard stats.' },
    { name: 'getToolDocumentation', template: 'getToolDocumentation({ toolName: "listProducts" })', description: 'Get help for a tool.' },
];

export function AgentTab() {
    const { products } = useProduct();
    const { orders } = useOrder();

    // Suggestion State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionType, setSuggestionType] = useState<'product' | 'order' | null>(null);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: "Hello! I'm your Gemini 3 Flash Agent. I can manage products, analyze images, and view your store's stats. Upload product images to get started or just tell me what to do!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [enableImageGen, setEnableImageGen] = useState(false);
    const [enableQC, setEnableQC] = useState(true);
    const [enableAutoScout, setEnableAutoScout] = useState(true);
    const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-lite-latest');
    const [selectedVoice, setSelectedVoice] = useState('Puck');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);

    // Advanced UI State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showConsole, setShowConsole] = useState(false);
    const [consoleInput, setConsoleInput] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showConsole && consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [consoleOutput, showConsole]);

    // Voice State
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [userVoiceTranscript, setUserVoiceTranscript] = useState('');
    const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null);
    const currentOutputTransRef = useRef('');
    const currentUserTransRef = useRef('');

    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, voiceTranscript]);

    // Cleanup audio resources on unmount or when voice is stopped
    useEffect(() => {
        return () => {
            stopVoiceSession();
        };
    }, []);

    const stopVoiceSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputContextRef.current) {
            outputContextRef.current.close();
            outputContextRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        setIsVoiceActive(false);
        setVoiceTranscript('');
        setUserVoiceTranscript('');
        setOutputAnalyser(null);
        currentOutputTransRef.current = '';
        currentUserTransRef.current = '';
    };

    const startVoiceSession = async () => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            toast.error("NEXT_PUBLIC_GEMINI_API_KEY not found in environment.");
            console.error("Voice mode requires NEXT_PUBLIC_GEMINI_API_KEY in .env for client-side access.");
            return;
        }

        if (typeof window !== 'undefined' && !window.isSecureContext) {
            toast.error("Voice mode requires a secure context (HTTPS or localhost).");
            return;
        }

        setIsConnecting(true);
        setVoiceTranscript('');
        setUserVoiceTranscript('');
        currentUserTransRef.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Setup Audio Contexts
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = inputCtx;
            outputContextRef.current = outputCtx;

            // Setup Analyser for Visualizer
            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 512;
            setOutputAnalyser(analyser); // Save to state to pass to component
            // We connect analyser to destination later when playing sources

            nextStartTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Define Tools for Live API (Must match backend capabilities)
            // Ideally we fetch this, but hardcoding for now to ensure availability in connect
            const functionDeclarations: any[] = [
                { name: 'listProducts', description: 'List products with optional filtering.', parameters: { type: "OBJECT", properties: { search: { type: "STRING" }, category: { type: "STRING" }, latest: { type: "BOOLEAN" } } } },
                { name: 'getArchivedProducts', description: 'List all products that are currently archived.', parameters: { type: "OBJECT", properties: {} } },
                { name: 'getProductDetails', description: 'Get full details of a specific product by ID.', parameters: { type: "OBJECT", properties: { id: { type: "NUMBER" } }, required: ['id'] } },
                { name: 'createProduct', description: 'Create a new product.', parameters: { type: "OBJECT", properties: { name: { type: "STRING" }, price: { type: "NUMBER" }, category: { type: "STRING" }, stock: { type: "NUMBER" } }, required: ['name', 'price', 'category', 'stock'] } },
                { name: 'updateProduct', description: 'Update an existing product.', parameters: { type: "OBJECT", properties: { id: { type: "NUMBER" }, name: { type: "STRING" }, price: { type: "NUMBER" }, stock: { type: "NUMBER" }, isArchived: { type: "BOOLEAN" } }, required: ['id'] } },
                { name: 'deleteProduct', description: 'Permanently delete a product.', parameters: { type: "OBJECT", properties: { id: { type: "NUMBER" } }, required: ['id'] } },
                { name: 'inspectProductImage', description: 'See a product image visually.', parameters: { type: "OBJECT", properties: { id: { type: "NUMBER" }, imageUrl: { type: "STRING" } } } },
                { name: 'getSiteStats', description: 'Get high-level store statistics.', parameters: { type: "OBJECT", properties: {} } },
                { name: 'listOrders', description: 'Search and filter orders.', parameters: { type: "OBJECT", properties: { status: { type: "STRING" }, search: { type: "STRING" } } } },
                { name: 'getOrderDetails', description: 'Get full details of a specific order.', parameters: { type: "OBJECT", properties: { orderId: { type: "NUMBER" } }, required: ['orderId'] } },
                { name: 'updateOrderStatus', description: 'Update status of an order.', parameters: { type: "OBJECT", properties: { orderId: { type: "NUMBER" }, status: { type: "STRING" } }, required: ['orderId', 'status'] } },
                { name: 'cancelOrder', description: 'Cancel an order.', parameters: { type: "OBJECT", properties: { orderId: { type: "NUMBER" } }, required: ['orderId'] } },
                { name: 'listCustomers', description: 'Search for customers.', parameters: { type: "OBJECT", properties: { search: { type: "STRING" } } } },
                { name: 'messageCustomer', description: 'Send email to a customer.', parameters: { type: "OBJECT", properties: { email: { type: "STRING" }, subject: { type: "STRING" }, message: { type: "STRING" } }, required: ['email', 'subject', 'message'] } },
                { name: 'listCoupons', description: 'List discount coupons.', parameters: { type: "OBJECT", properties: { search: { type: "STRING" }, activeOnly: { type: "BOOLEAN" } } } },
                { name: 'createCoupon', description: 'Create a new discount coupon.', parameters: { type: "OBJECT", properties: { code: { type: "STRING" }, discountType: { type: "STRING" }, discountValue: { type: "NUMBER" } }, required: ['code', 'discountType', 'discountValue'] } },
                { name: 'getWishlistInsights', description: 'Analyze product wishlists.', parameters: { type: "OBJECT", properties: {} } },
            ];

            if (enableImageGen) {
                functionDeclarations.push({
                    name: 'generateImage',
                    description: 'Generate or edit an image based on a text prompt.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            prompt: { type: "STRING", description: "Detailed description of the image to generate" },
                            imageUrl: { type: "STRING", description: "Optional: URL of an image to use as a reference/source." }
                        },
                        required: ['prompt']
                    }
                });
            }

            const tools = [{ functionDeclarations }];

            const initialContent = messages
                .filter((_, i) => i > 0) // Skip welcome message in history
                .map(m => {
                    const parts: any[] = [{ text: m.text }];
                    if (m.images && m.images.length > 0) {
                        m.images.forEach(img => {
                            try {
                                const mimeType = img.split(';')[0].split(':')[1];
                                const base64Data = img.split(',')[1];
                                parts.push({ inlineData: { mimeType, data: base64Data } });
                            } catch (e) { console.error("Error parsing message image for initialContent", e); }
                        });
                    }
                    return { role: m.role, parts };
                });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Voice session opened');
                        setIsConnecting(false);
                        setIsVoiceActive(true);
                        toast.success("Voice Connected");

                        // Audio Input Stream
                        try {
                            const source = inputCtx.createMediaStreamSource(stream);
                            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromise.then(session => {
                                    if (session) {
                                        session.sendRealtimeInput({ media: pcmBlob });
                                    }
                                }).catch(err => console.error("Error sending audio input:", err));
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputCtx.destination);
                        } catch (err) {
                            console.error("Error setting up input audio nodes:", err);
                        }
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            nextStartTimeRef.current = Math.max(
                                nextStartTimeRef.current,
                                outputCtx.currentTime
                            );
                            const audioBuffer = await decodeAudioData(
                                decode(audioData),
                                outputCtx,
                                24000,
                                1
                            );
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;

                            // Route through analyser for visualization
                            if (analyser) {
                                source.connect(analyser);
                                analyser.connect(outputCtx.destination);
                            } else {
                                source.connect(outputCtx.destination);
                            }

                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        // Handle Tool Calls
                        if (msg.toolCall) {
                            for (const fc of msg.toolCall.functionCalls) {
                                console.log('Tool call received:', fc);
                                toast.loading(`Executing ${fc.name}...`, { id: 'tool-exec' });

                                try {
                                    const response = await fetch('/api/ai/agent', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            type: 'execute_tool',
                                            toolName: fc.name,
                                            toolArgs: fc.args,
                                            enableQC,
                                            enableAutoScout,
                                            model: 'gemini-2.5-flash' // Context model for tool execution if needed
                                        })
                                    });
                                    const resultData = await response.json();

                                    toast.success(`Executed ${fc.name}`, { id: 'tool-exec' });

                                    // Send result back to Live API
                                    sessionPromise.then(session => session.sendToolResponse({
                                        functionResponses: [{
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: resultData.result }
                                        }]
                                    }));

                                    // Update visual log with potential visual results
                                    setMessages(prev => [...prev, {
                                        role: 'model',
                                        text: `*Executed Tool:* \`${fc.name}\`\nResult: ${typeof resultData.result === 'string' ? resultData.result.slice(0, 100) : JSON.stringify(resultData.result).slice(0, 100)}...`,
                                        images: resultData.extraParts?.filter((p: any) => p.inlineData).map((p: any) => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`),
                                        imageGeneration: resultData.imageGeneration
                                    }]);

                                } catch (err) {
                                    console.error('Tool execution failed', err);
                                    toast.error(`Tool ${fc.name} failed`, { id: 'tool-exec' });
                                }
                            }
                        }

                        // Handle User Transcript (input transcription)
                        if (msg.serverContent?.inputTranscription) {
                            currentUserTransRef.current = msg.serverContent.inputTranscription.text;
                            setUserVoiceTranscript(currentUserTransRef.current);
                        }

                        // Handle Transcript Updates (serverContent.outputTranscription)
                        if (msg.serverContent?.outputTranscription) {
                            // If user was speaking, commit their text to history first
                            if (currentUserTransRef.current) {
                                setMessages(prev => [...prev, { role: 'user', text: currentUserTransRef.current }]);
                                currentUserTransRef.current = '';
                                setUserVoiceTranscript('');
                            }
                            currentOutputTransRef.current += msg.serverContent.outputTranscription.text;
                            setVoiceTranscript(currentOutputTransRef.current);
                        }

                        // Commit model response to history when turn is complete
                        if (msg.serverContent?.turnComplete) {
                            const finalText = currentOutputTransRef.current;
                            if (finalText.trim()) {
                                setMessages(prev => [...prev, { role: 'model', text: finalText }]);
                            }
                            // Clear buffer for next turn
                            currentOutputTransRef.current = '';
                            setVoiceTranscript('');
                        }
                    },
                    onclose: (e?: any) => {
                        console.log('Voice session closed', e);
                        if (e && e.reason) console.log('Close reason:', e.reason);
                        stopVoiceSession();
                    },
                    onerror: (e) => {
                        console.error('Voice session error details:', e);
                        toast.error("Voice connection error");
                        stopVoiceSession();
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: tools as any,
                    systemInstruction: {
                        parts: [
                            {
                                text: `You are a helpful e-commerce store admin assistant speaking with the store owner. Be concise, professional.
                        
${enableAutoScout ? 'MANDATORY INSTRUCTION: YOUR VERY FIRST ACTION for any request involving products MUST be to call listProducts with EMPTY arguments {} to see ALL products. DO NOT use search, category, or subcategory filters on your first call.' : ''}`
                            },
                            {
                                text: `CONTEXT OF PREVIOUS CONVERSATION:\n${messages.slice(1).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}`
                            }
                        ]
                    },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: selectedVoice
                            }
                        }
                    }
                }
            });

            sessionPromise.catch(err => {
                console.error("Session Promise Rejected:", err);
                setIsConnecting(false);
                toast.error(`Session failed to start: ${err.message || 'Check Console'}`);
            });

        } catch (error) {
            console.error("Failed to start voice session", error);
            setIsConnecting(false);
            toast.error("Failed to initialize voice session");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(processFile);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setImages(prev => [...prev, reader.result as string]);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    processFile(file);
                }
            });
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        processFile(file);
                    }
                }
            }
        }
    };


    const deleteMessage = (index: number) => {
        setMessages(prev => prev.filter((_, i) => i !== index));
    };

    const regenerateResponse = async () => {
        // Find last user message
        const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
        if (lastUserIdx === -1) return;

        // Keep messages up to last user message
        const newHistory = messages.slice(0, lastUserIdx + 1);
        setMessages(newHistory);

        // Retrigger send (hacky but works for now, ideally separate logic)
        // We need the input/images from that message to recall sendMessage
        // But sendMessage uses state. Let's just create a helper using the message content.
        const lastMsg = newHistory[lastUserIdx];
        await sendRequest(lastMsg.text, lastMsg.images || [], newHistory);
    };

    const uploadGeneratedImage = async (base64: string, prompt: string) => {
        setUploadingImg(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Data: base64 })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Image uploaded successfully!');
                // Notify agent
                const sysMsg = `User uploaded the generated image: ${data.url}`;
                // Add hidden user message or system note? Let's just send it as a user message for now so agent sees it.
                // Or better, handle it silently.
                await sendRequest(sysMsg, [], [...messages, { role: 'user', text: `[System: User uploaded image] ${data.url}` }]);
            } else {
                toast.error('Upload failed: ' + data.error);
            }
        } catch (e) {
            toast.error('Upload error');
        } finally {
            setUploadingImg(false);
        }
    };

    const sendRequest = async (text: string, imgs: string[], history: Message[]) => {
        setLoading(true);
        try {
            const historyPayload = history
                .filter((_, i) => i > 0) // Skip welcome
                .map(m => {
                    const parts: any[] = [{ text: m.text }];
                    if (m.images && m.images.length > 0) {
                        m.images.forEach(img => {
                            const mimeType = img.split(';')[0].split(':')[1];
                            const base64Data = img.split(',')[1];
                            parts.push({
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            });
                        });
                    }
                    return {
                        role: m.role,
                        parts: parts
                    };
                });

            const response = await fetch('/api/ai/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    images: imgs,
                    history: historyPayload,
                    enableImageGen,
                    enableQC,
                    enableAutoScout,
                    model: selectedModel
                }),
            });

            const data = await response.json();

            if (data.text || data.imageGeneration) {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: data.text || "Here is the generated image:",
                    imageGeneration: data.imageGeneration
                }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'model', text: `❌ Error: ${data.error}` }]);
            }

        } catch (error) {
            console.error('Agent Error:', error);
            setMessages(prev => [...prev, { role: 'model', text: "❌ Connection failed." }]);
        } finally {
            setLoading(false);
        }
    };



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        const cursor = e.target.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursor);

        // Check for triggers: @product: or @order:
        const productMatch = textBeforeCursor.match(/@product:([^@]*)$/);
        const orderMatch = textBeforeCursor.match(/@order:([^@]*)$/);

        if (productMatch) {
            setSuggestionType('product');
            setSuggestionQuery(productMatch[1]);
            setShowSuggestions(true);
        } else if (orderMatch) {
            setSuggestionType('order');
            setSuggestionQuery(orderMatch[1]);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setSuggestionType(null);
        }
    };

    const insertSuggestion = (item: any) => {
        if (!inputRef.current) return;

        const cursor = inputRef.current.selectionStart || 0;
        const text = input;
        const textBeforeCursor = text.slice(0, cursor);
        const textAfterCursor = text.slice(cursor);

        let newText = text;

        if (suggestionType === 'product') {
            const match = textBeforeCursor.match(/@product:([^@]*)$/);
            if (match) {
                const triggerLength = match[0].length;
                const startIdx = textBeforeCursor.length - triggerLength;
                const replacement = `${item.id}`;
                newText = text.slice(0, startIdx) + replacement + " " + textAfterCursor;
            }
        } else if (suggestionType === 'order') {
            const match = textBeforeCursor.match(/@order:([^@]*)$/);
            if (match) {
                const triggerLength = match[0].length;
                const startIdx = textBeforeCursor.length - triggerLength;
                const replacement = `${item.id}`;
                newText = text.slice(0, startIdx) + replacement + " " + textAfterCursor;
            }
        }

        setInput(newText);
        setShowSuggestions(false);
        setSuggestionType(null);
        inputRef.current.focus();
    };

    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!suggestionType) {
                setSuggestions([]);
                return;
            }

            const q = suggestionQuery.toLowerCase();

            if (suggestionType === 'product') {
                try {
                    const params = new URLSearchParams();
                    if (suggestionQuery) {
                        params.append('search', suggestionQuery);
                    }

                    const res = await fetch(`/api/products?${params.toString()}`);
                    const data = await res.json();

                    if (data.success) {
                        const mappedData = data.data.map((p: any) => {
                            let displayImage = p.image || (p.images && p.images.length > 0 ? p.images[0] : '');

                            // Fallback: Check variants for an image if main product has none
                            if (!displayImage && p.options && Array.isArray(p.options)) {
                                for (const opt of p.options) {
                                    if (opt.values && Array.isArray(opt.values)) {
                                        const valWithImage = opt.values.find((v: any) => v.image);
                                        if (valWithImage) {
                                            displayImage = valWithImage.image;
                                            break;
                                        }
                                    }
                                }
                            }

                            return {
                                ...p,
                                image: displayImage
                            };
                        });
                        setSuggestions(mappedData.slice(0, 20));
                    }
                } catch (error) {
                    console.error("Failed to fetch product suggestions", error);
                }
            } else if (suggestionType === 'order') {
                const filteredOrders = orders
                    .filter((o: any) =>
                        o.id.toString().includes(q) ||
                        (o.customer && o.customer.toLowerCase().includes(q)) ||
                        (o.email && o.email.toLowerCase().includes(q))
                    )
                    .sort((a: any, b: any) => {
                        // Sort by closeness of match or recency
                        // If exact ID match, top
                        if (a.id.toString() === q) return -1;
                        if (b.id.toString() === q) return 1;
                        // Date desc
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .slice(0, 10);
                setSuggestions(filteredOrders);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [suggestionQuery, suggestionType, orders]);

    const sendMessage = async () => {
        if ((!input.trim() && images.length === 0) || loading) return;

        const userMessage: Message = { role: 'user', text: input, images: images.length > 0 ? [...images] : undefined };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        setInput('');
        setImages([]);

        await sendRequest(userMessage.text, userMessage.images || [], newMessages);
    };

    const formatConsoleOutput = (data: any) => {
        if (!data || !data.documentation) return JSON.stringify(data, null, 2);

        const doc = data.documentation;
        // Check if it's a list of tools or single tool
        if (Array.isArray(doc)) {
            return `AVAILABLE TOOLS\n---------------\n${doc.map((t: any) => `* ${t.name}: ${t.description.split('.')[0]}.`).join('\n')}\n\nType 'help <toolName>' for details.`;
        }

        return `
NAME
  ${doc.name}

DESCRIPTION
  ${doc.description}

PARAMETERS
${Object.entries(doc.parameters?.properties || {}).map(([key, val]: [string, any]) =>
            `  ${key} (${val.type})\n      ${val.description || ''} ${doc.parameters?.required?.includes(key) ? '[REQUIRED]' : '[OPTIONAL]'}`
        ).join('\n')}
`;
    };

    const handleConsoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
                setHistoryIndex(newIndex);
                setConsoleInput(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setConsoleInput(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setConsoleInput('');
            }
        }
    };

    const handleConsoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consoleInput.trim()) return;

        const cmd = consoleInput.trim();

        // Update history
        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        setConsoleInput('');

        if (cmd === 'clear' || cmd === 'cls') {
            setConsoleOutput('');
            return;
        }

        setConsoleOutput(prev => prev + `\n> ${cmd}\nProcessing...`);

        // Basic help command parsing
        if (cmd === 'help' || cmd.startsWith('help ')) {
            const toolName = cmd.split(' ')[1];
            try {
                const res = await fetch('/api/ai/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'execute_tool',
                        toolName: 'getToolDocumentation',
                        toolArgs: toolName ? { toolName } : {},
                        model: selectedModel
                    })
                });
                const data = await res.json();
                if (data.success && data.result) {
                    const formatted = formatConsoleOutput(data.result);
                    setConsoleOutput(prev => prev.replace('Processing...', '') + formatted);
                } else {
                    setConsoleOutput(prev => prev.replace('Processing...', '') + `Error: ${data.error || 'Failed to fetch docs.'}`);
                }
            } catch (err) {
                setConsoleOutput(prev => prev.replace('Processing...', '') + `Network Error.`);
            }
        } else {
            setConsoleOutput(prev => prev.replace('Processing...', '') + `Unknown command. Try 'help' or 'help <toolName>'.`);
        }
    };

    return (
        <div
            className="flex flex-col h-[calc(100vh-12rem)] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-2xl focus:outline-none"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg relative">
                        <Sparkles className="w-5 h-5 text-white" />
                        {isVoiceActive && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Gemini 3 Flash Agent
                            {isVoiceActive && <span className="text-xs text-red-400 font-normal border border-red-500/50 px-2 py-0.5 rounded-full bg-red-500/10">LIVE</span>}
                        </h3>
                        <p className="text-xs text-gray-400">Autonomous Store Manager • Multimodal</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">

                    {/* Console Toggle */}
                    <button
                        onClick={() => setShowConsole(!showConsole)}
                        className={`p-2 rounded-lg transition-colors ${showConsole ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                        title="Developer Console"
                    >
                        <Terminal className="w-5 h-5" />
                    </button>

                    {/* Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                        title="Function Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Voice Toggle */}
                    <button
                        onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
                        disabled={isConnecting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isVoiceActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isVoiceActive ? (
                            <MicOff className="w-4 h-4" />
                        ) : (
                            <Mic className="w-4 h-4" />
                        )}
                        {isVoiceActive ? 'Stop Voice' : 'Voice Mode'}
                    </button>

                    <div className={`flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700 ${isVoiceActive ? 'opacity-50 pointer-events-none' : ''}`}>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-gray-800 text-white text-xs font-medium rounded-md px-3 py-1.5 border-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="gemini-flash-lite-latest">Gemini 2.5 Flash-Lite</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                            <option value="deepseek-chat">DeepSeek V3</option>
                        </select>
                    </div>

                    <div className={`flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700 ${isVoiceActive ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="pl-2 flex items-center gap-1.5 border-r border-gray-700 pr-2">
                            <Bot className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-bold text-gray-500 tracking-wider">VOICE</span>
                        </div>
                        <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="bg-gray-800 text-white text-xs font-medium rounded-md px-3 py-1.5 border-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[100px]"
                        >
                            <option value="Puck">Puck (Male)</option>
                            <option value="Charon">Charon (Male)</option>
                            <option value="Kore">Kore (Female)</option>
                            <option value="Fenrir">Fenrir (Male)</option>
                            <option value="Aoede">Aoede (Female)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Function Sidebar */}
            {isMenuOpen && (
                <div className="absolute top-16 left-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto z-20 shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Functions</h4>
                        <button onClick={() => setIsMenuOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="space-y-2">
                        {TOOL_DEFINITIONS.map(tool => (
                            <button
                                key={tool.name}
                                onClick={() => {
                                    setInput(prev => prev + (prev ? '\n' : '') + tool.template);
                                    if (window.innerWidth < 768) setIsMenuOpen(false);
                                }}
                                className="w-full text-left p-2 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs text-blue-200 transition-colors group"
                            >
                                <div className="font-mono font-bold mb-1 group-hover:text-white">{tool.name}</div>
                                <div className="text-gray-400 truncate">{tool.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Developer Console */}
            {showConsole && (
                <div className="bg-black border-b border-gray-700 p-4 h-64 overflow-hidden flex flex-col font-mono text-xs">
                    <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-green-400 mb-2 font-mono scrollbar-thin">
                        {consoleOutput || "Welcome to the Developer Console.\nType 'help' to list tools or 'help <toolName>' for details."}
                        <div ref={consoleEndRef} />
                    </div>
                    <form onSubmit={handleConsoleSubmit} className="flex gap-2 border-t border-gray-800 pt-2">
                        <span className="text-green-500 font-bold">{'>'}</span>
                        <input
                            type="text"
                            value={consoleInput}
                            onChange={e => setConsoleInput(e.target.value)}
                            onKeyDown={handleConsoleKeyDown}
                            className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                            placeholder="Type command..."
                            autoFocus
                        />
                    </form>
                </div>
            )}

            {/* Voice Visualizer and Transcript */}
            {
                isVoiceActive && (
                    <div className="bg-gray-800/50 border-b border-gray-700 p-4 flex flex-col items-center justify-center gap-3 transition-all animate-in slide-in-from-top-4">
                        <AudioVisualizer analyser={outputAnalyser} isActive={isVoiceActive} color="#60A5FA" />
                        {voiceTranscript && (
                            <p className="text-blue-300 text-sm italic text-center animate-pulse">
                                "{voiceTranscript}"
                            </p>
                        )}
                        {userVoiceTranscript && (
                            <p className="text-gray-400 text-xs italic text-center mt-1">
                                You: "{userVoiceTranscript}"
                            </p>
                        )}
                    </div>
                )
            }

            {/* Feature Toggles */}
            <div className="p-2 border-b border-gray-700 bg-gray-800/50 flex items-center justify-end gap-2">
                <button
                    onClick={() => setEnableAutoScout(!enableAutoScout)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${enableAutoScout
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                    title="Auto-Scout Inventory"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Scout
                </button>
                <button
                    onClick={() => setEnableImageGen(!enableImageGen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${enableImageGen
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/50'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                    title="Enable Image Generation tools"
                >
                    <ImageIcon className="w-3.5 h-3.5" />
                    ImgGen
                </button>
                <button
                    onClick={() => setEnableQC(!enableQC)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${enableQC
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/50'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                    title="Enable Quality Control for Image Gen"
                >
                    <Check className="w-3.5 h-3.5" />
                    QC
                </button>
                <button
                    onClick={() => setMessages([])}
                    className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Clear Chat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Drag Overlay */}
            {
                isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-lg pointer-events-none">
                        <div className="text-center text-white p-8 bg-gray-900 rounded-xl shadow-xl">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                            <h3 className="text-xl font-bold">Drop Images Here</h3>
                            <p className="text-gray-400">for instant analysis</p>
                        </div>
                    </div>
                )
            }

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
                {isVoiceActive && (
                    <div className="flex justify-center my-4">
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-3 rounded-full flex items-center gap-3 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="font-mono text-sm">Listening to microphone...</span>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`group flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-600 to-purple-600'
                            }`}>
                            {msg.role === 'user' ? <User className="w-6 h-6 text-gray-300" /> : <Bot className="w-6 h-6 text-white" />}
                        </div>

                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            {/* Message Actions */}
                            <div className={`flex gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <button onClick={() => deleteMessage(index)} className="text-gray-500 hover:text-red-400" title="Delete Message"><Trash2 className="w-3 h-3" /></button>
                                {msg.role === 'model' && index === messages.length - 1 && (
                                    <button onClick={regenerateResponse} className="text-gray-500 hover:text-blue-400" title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
                                )}
                            </div>

                            {msg.images && msg.images.length > 0 && (
                                <div className={`mb-2 grid gap-2 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-sm`}>
                                    {msg.images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="rounded-lg overflow-hidden border border-gray-600">
                                            <img src={img} alt={`Upload ${imgIdx + 1}`} className="w-full h-auto object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={`px-5 py-3 rounded-2xl prose prose-invert prose-sm max-w-none ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm shadow-md'
                                }`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            return inline ? (
                                                <code className="bg-gray-900 px-1 py-0.5 rounded text-blue-300 font-mono text-xs" {...props}>{children}</code>
                                            ) : (
                                                <div className="bg-gray-950 p-3 rounded-lg overflow-x-auto my-2 border border-gray-700">
                                                    <code className="text-sm font-mono text-gray-300" {...props}>{children}</code>
                                                </div>
                                            )
                                        }
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>

                                {/* Image Generation Review Card */}
                                {msg.imageGeneration && (
                                    <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400 font-mono">Generated Image</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => uploadGeneratedImage(msg.imageGeneration!.base64, msg.imageGeneration!.prompt)}
                                                    disabled={uploadingImg}
                                                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                                    title="Upload & Use"
                                                >
                                                    {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={regenerateResponse}
                                                    className="p-1.5 bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white rounded-md transition-colors"
                                                    title="Regenerate"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteMessage(index)}
                                                    className="p-1.5 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <img src={msg.imageGeneration.base64} alt="Generated" className="w-full rounded-md border border-gray-800" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-700">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Gemini is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-4 bg-gray-800 border-t border-gray-700 relative ${isVoiceActive ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Suggestions Popover */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-4 w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
                        <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 text-xs font-semibold text-gray-400">
                            Select {suggestionType === 'product' ? 'Product' : 'Order'}
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {suggestions.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => insertSuggestion(item)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800 last:border-0 transition-colors"
                                >
                                    {suggestionType === 'product' && (
                                        <>
                                            <div className="w-10 h-10 bg-gray-800 rounded flex-shrink-0 overflow-hidden">
                                                {item.image ? (
                                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                        <ImageIcon size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{item.name}</div>
                                                <div className="text-xs text-gray-400">ID: {item.id} • ৳{item.price}</div>
                                            </div>
                                        </>
                                    )}
                                    {suggestionType === 'order' && (
                                        <>
                                            <div className="w-10 h-10 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
                                                <div className="text-blue-500 font-bold">#{item.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{item.customer || 'Unknown'}</div>
                                                <div className="text-xs text-gray-400">{item.email} • ৳{item.total}</div>
                                            </div>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-600">
                                <img src={img} alt="Selected" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-0 right-0 p-1 bg-black/50 text-white hover:bg-red-500/80 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-3">
                    {/* Image Upload Button */}
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple // Enable multiple files
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors" title="Upload Images">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Text Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={isVoiceActive ? "Voice Mode active..." : "Type @product: or @order: to search..."}
                        className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        disabled={loading || isVoiceActive}
                    />

                    {/* Send Button */}
                    <button
                        onClick={sendMessage}
                        disabled={(!input.trim() && images.length === 0) || loading || isVoiceActive}
                        className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div >
    );
}