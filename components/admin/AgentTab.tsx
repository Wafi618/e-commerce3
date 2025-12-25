import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Sparkles, Bot, User, Loader2, Image as ImageIcon, X, Trash2, RefreshCw, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProduct, useOrder } from '@/contexts';

interface Message {
    role: 'user' | 'model';
    text: string;
    images?: string[];
    imageGeneration?: {
        base64: string;
        prompt: string;
    };
}

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
    const [images, setImages] = useState<string[]>([]); // Changed to array
    const [enableImageGen, setEnableImageGen] = useState(false);
    const [enableQC, setEnableQC] = useState(true);
    const [enableAutoScout, setEnableAutoScout] = useState(true);
    const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Gemini 3 Flash Agent</h3>
                        <p className="text-xs text-gray-400">Autonomous Store Manager • Multimodal</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-gray-800 text-white text-xs font-medium rounded-md px-3 py-1.5 border-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                            <option value="gemini-flash-latest">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                            <option value="deepseek-chat">DeepSeek V3</option>
                        </select>
                    </div>

                    {/* Feature Toggles */}
                    <div className="flex items-center gap-2">
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
                    </div>

                    <button
                        onClick={() => setMessages([])}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-lg pointer-events-none">
                    <div className="text-center text-white p-8 bg-gray-900 rounded-xl shadow-xl">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                        <h3 className="text-xl font-bold">Drop Images Here</h3>
                        <p className="text-gray-400">for instant analysis</p>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
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
            <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
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
                        placeholder="Type @product: or @order: to search..."
                        className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        disabled={loading}
                    />

                    {/* Send Button */}
                    <button
                        onClick={sendMessage}
                        disabled={(!input.trim() && images.length === 0) || loading}
                        className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
