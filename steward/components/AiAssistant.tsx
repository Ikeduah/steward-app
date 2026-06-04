/**
 * AiAssistant — hidden from UI (coming soon).
 *
 * This component is intentionally disabled for the current release.
 * The full implementation is preserved below in comments and can be
 * restored for a future release by removing this stub and uncommenting
 * the original code.
 */
export function AiAssistant() {
  return null;
}

/* ─── AI ASSISTANT IMPLEMENTATION (COMING SOON) ─────────────────────────────
 *
 * To restore: remove the stub export above and uncomment everything below.
 *
 * import { useState, useRef, useEffect } from "react";
 * import { useAuth, useOrganization } from "@clerk/nextjs";
 * import { fetchEventSource } from "@microsoft/fetch-event-source";
 * import { motion, AnimatePresence } from "framer-motion";
 * import { Bot, ChevronUp, ChevronDown, Send } from "lucide-react";
 *
 * interface Message {
 *   role: "user" | "assistant";
 *   content: string;
 * }
 *
 * const ADMIN_PROMPTS = [
 *   "Generate an asset summary report",
 *   "Show me overdue checkouts",
 *   "What's in the maintenance queue?",
 *   "Summarize open incidents",
 * ];
 *
 * const MEMBER_PROMPTS = [
 *   "What do I have checked out?",
 *   "Help me diagnose an equipment issue",
 *   "When is my item due back?",
 * ];
 *
 * export function AiAssistant() {
 *   const { getToken } = useAuth();
 *   const { membership } = useOrganization();
 *   const isAdmin = membership?.role === "org:admin";
 *
 *   const [isOpen, setIsOpen] = useState(true);
 *   const [messages, setMessages] = useState<Message[]>([]);
 *   const [input, setInput] = useState("");
 *   const [isStreaming, setIsStreaming] = useState(false);
 *   const [streamingContent, setStreamingContent] = useState("");
 *   const [toolStatus, setToolStatus] = useState("");
 *   const messagesEndRef = useRef<HTMLDivElement>(null);
 *   const abortControllerRef = useRef<AbortController | null>(null);
 *
 *   useEffect(() => {
 *     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 *   }, [messages, streamingContent, toolStatus]);
 *
 *   useEffect(() => {
 *     return () => { abortControllerRef.current?.abort(); };
 *   }, []);
 *
 *   const handleSend = async (text?: string) => {
 *     const messageText = (text ?? input).trim();
 *     if (!messageText || isStreaming) return;
 *     setMessages((prev) => [...prev, { role: "user", content: messageText }]);
 *     setInput("");
 *     setIsStreaming(true);
 *     setStreamingContent("");
 *     setToolStatus("");
 *     const controller = new AbortController();
 *     abortControllerRef.current = controller;
 *     let accumulated = "";
 *     try {
 *       const token = await getToken();
 *       await fetchEventSource("/api/ai/chat", {
 *         method: "POST",
 *         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 *         body: JSON.stringify({ message: messageText, history: messages.map((m) => ({ role: m.role, content: m.content })) }),
 *         signal: controller.signal,
 *         onmessage(ev) {
 *           if (ev.data === "[DONE]") { setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]); setStreamingContent(""); setToolStatus(""); setIsStreaming(false); controller.abort(); return; }
 *           if (ev.data === "[ERROR]") { setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]); setStreamingContent(""); setToolStatus(""); setIsStreaming(false); controller.abort(); return; }
 *           try {
 *             const event = JSON.parse(ev.data) as { t: string; v: string };
 *             if (event.t === "d") { accumulated += event.v; setStreamingContent(accumulated); if (event.v) setToolStatus(""); }
 *             else if (event.t === "s") { setToolStatus(event.v); }
 *             else if (event.t === "e") { setMessages((prev) => [...prev, { role: "assistant", content: event.v }]); setStreamingContent(""); setToolStatus(""); setIsStreaming(false); controller.abort(); }
 *           } catch { }
 *         },
 *         onerror() { throw new Error("SSE error"); },
 *       });
 *     } catch {
 *       if (!controller.signal.aborted) { setMessages((prev) => [...prev, { role: "assistant", content: accumulated || "Connection error. Please try again." }]); setStreamingContent(""); setToolStatus(""); setIsStreaming(false); }
 *     }
 *   };
 *
 *   const suggestedPrompts = isAdmin ? ADMIN_PROMPTS : MEMBER_PROMPTS;
 *
 *   return (
 *     <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
 *       <button onClick={() => setIsOpen((o) => !o)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
 *         <div className="flex items-center gap-2">
 *           <Bot className="w-5 h-5 text-emerald-600" />
 *           <span className="font-bold text-gray-900">Steward AI</span>
 *           <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
 *         </div>
 *         {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
 *       </button>
 *       <AnimatePresence initial={false}>
 *         {isOpen && (
 *           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
 *             <div className="border-t border-gray-100">
 *               <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
 *                 {messages.length === 0 && !isStreaming && (
 *                   <div className="space-y-2">
 *                     <p className="text-xs text-gray-400 mb-3">Ask about your inventory:</p>
 *                     {suggestedPrompts.map((prompt) => (
 *                       <button key={prompt} onClick={() => handleSend(prompt)} className="block text-left w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-full hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors">{prompt}</button>
 *                     ))}
 *                   </div>
 *                 )}
 *                 <AnimatePresence>
 *                   {messages.map((msg, i) => (
 *                     <motion.div key={i} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
 *                       <div className={msg.role === "user" ? "bg-emerald-600 text-white rounded-2xl px-4 py-2 text-sm max-w-[80%] whitespace-pre-wrap" : "bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl px-4 py-2 text-sm max-w-[80%] whitespace-pre-wrap"}>{msg.content}</div>
 *                     </motion.div>
 *                   ))}
 *                 </AnimatePresence>
 *                 {isStreaming && (
 *                   <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-start">
 *                     <div className="bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl px-4 py-2 text-sm max-w-[80%] whitespace-pre-wrap">
 *                       {streamingContent ? (<>{streamingContent}<motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-0.5 h-3.5 bg-emerald-600 ml-0.5 align-middle" /></>) : toolStatus ? (<span className="flex items-center gap-2 text-gray-400"><motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />{toolStatus}...</span>) : (<motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-0.5 h-3.5 bg-emerald-600 align-middle" />)}
 *                     </div>
 *                   </motion.div>
 *                 )}
 *                 <div ref={messagesEndRef} />
 *               </div>
 *               <div className="p-4 border-t border-gray-100 flex gap-2">
 *                 <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} disabled={isStreaming} placeholder="Ask about your inventory..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50" />
 *                 <button onClick={() => handleSend()} disabled={isStreaming || !input.trim()} className="bg-emerald-600 text-white rounded-xl px-4 py-2 hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
 *               </div>
 *             </div>
 *           </motion.div>
 *         )}
 *       </AnimatePresence>
 *     </div>
 *   );
 * }
 *
 * ─── END AI ASSISTANT IMPLEMENTATION ─────────────────────────────────────── */
