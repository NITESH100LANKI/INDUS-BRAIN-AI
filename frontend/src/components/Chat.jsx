import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, CheckCircle, ShieldAlert, BookOpen, Sparkles, ChevronRight } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'Assistant',
      text: (
        "Welcome to **INDUS BRAIN AI Expert Copilot**.\n\n" +
        "I am connected to the plant document repository, compliance audits, and asset database. " +
        "Ask me anything about maintenance histories, failures, SOP instructions, or regulatory gaps.\n\n" +
        "💡 *Example questions are listed below to start testing immediately.*"
      ),
      citations: [],
      created_at: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('session_default');
  const [selectedCitations, setSelectedCitations] = useState(null);

  const messagesEndRef = useRef(null);

  const suggestions = [
    "What caused repeated pump failure?",
    "Show inspection issues for Boiler-2.",
    "Which SOP applies to this equipment?",
    "What compliance gaps exist in the latest audit?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    if (!textToSend) setInput('');

    // Append User Message
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'User',
      text: msgText,
      citations: [],
      created_at: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: msgText })
      });
      const data = await res.json();

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'Assistant',
        text: data.text,
        citations: data.citations || [],
        created_at: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Auto-select citations if returned
      if (aiMsg.citations.length > 0) {
        setSelectedCitations(aiMsg);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'Assistant',
        text: "❌ Service offline. Please verify that the FastAPI backend is running and reachable.",
        citations: [],
        created_at: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render markdown paragraphs
  const renderMessageText = (text) => {
    return text.split('\n\n').map((paragraph, idx) => {
      // Very simple formatter for bold and bullets
      let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const items = paragraph.split('\n');
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
            {items.map((li, liIdx) => {
              const liText = li.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              return <li key={liIdx} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: liText }} />;
            })}
          </ul>
        );
      }
      return <p key={idx} className="text-xs leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col relative">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit flex items-center space-x-2">
          <Sparkles className="text-amber-500 h-7 w-7" />
          <span>Industrial RAG Expert Copilot</span>
        </h2>
        <p className="text-slate-400 text-sm">Semantic citation-grounded RAG chatbot. Fully explains operational safety queries based on plant documentation.</p>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex space-x-6 overflow-hidden relative">
        
        {/* Chat Bubbles column */}
        <div className="flex-1 glass-panel rounded-xl flex flex-col justify-between overflow-hidden">
          {/* Scrollable chat body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'Assistant';
              return (
                <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-xl p-4 border ${
                    isAi 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-100' 
                      : 'bg-amber-500/10 border-amber-500/35 text-amber-100'
                  }`}>
                    <div className="flex justify-between items-center mb-1.5 border-b border-slate-800/40 pb-1">
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">{msg.sender.toUpperCase()}</span>
                      <span className="text-[9px] text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div className="space-y-1 font-sans">
                      {renderMessageText(msg.text)}
                    </div>

                    {isAi && msg.citations.length > 0 && (
                      <button 
                        onClick={() => setSelectedCitations(msg)}
                        className="mt-3 flex items-center space-x-1 text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded border border-amber-500/15 hover:bg-amber-500/15 transition-all"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Inspect {msg.citations.length} Grounded Citations</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex items-center space-x-3">
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-400">Synthesizing plant evidence and references...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-6 py-3 border-t border-slate-800 bg-[#090d16]/30 flex flex-wrap gap-2">
            {suggestions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="text-[11px] font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-full border border-slate-850 transition-all truncate max-w-[280px]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* User inputs */}
          <div className="p-4 border-t border-slate-800 bg-[#070b13]">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask about pump cavitation, valve tests, or safety check violations..."
                className="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-5 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all flex-shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider font-extrabold">Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Citations Inspector column (gorgeous sidebar slider) */}
        {selectedCitations && (
          <div className="w-80 glass-panel rounded-xl p-5 flex flex-col overflow-hidden animate-slide-in relative flex-shrink-0 border-l border-amber-500/20">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="text-amber-500 h-4.5 w-4.5" />
                <span>Citation Inspector</span>
              </h3>
              <button 
                onClick={() => setSelectedCitations(null)}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono"
              >
                CLOSE
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedCitations.citations.map((cit, idx) => (
                <div key={idx} className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-850/80 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-slate-300 font-mono truncate">{cit.document_name}</span>
                    </div>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase flex-shrink-0">
                      Pg {cit.page_num || 1}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-slate-400 italic leading-relaxed">
                    "...{cit.snippet}..."
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-slate-400 font-semibold">Grounded Evidence</span>
                    </span>
                    <span className="font-bold text-slate-400">Confidence: <span className="text-emerald-400">{Math.round(cit.confidence * 100)}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Add simple helper for spinner
const Loader2 = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
