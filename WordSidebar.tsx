import React, { useState, useEffect } from 'react';
import { X, RefreshCw, BookOpen, Volume2, Sparkles } from 'lucide-react';

interface WordData {
  ipa: string;
  explanation: string;
  gloss: string;
  example: string;
}

interface WordSidebarProps {
  word: string;
  onClose: () => void;
}

export default function WordSidebar({ word, onClose }: WordSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<WordData | null>(null);

  const fetchTranslation = async () => {
    if (!word) return;
    
    setLoading(true);
    setError(false);
    setData(null);

    try {
      // Cast import.meta to any to avoid "Property 'env' does not exist on type 'ImportMeta'" TS error
      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(word)}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      // Expected format: IPA|German explanation|English gloss|Example sentence
      // Cleaning potentially Markdown formatted response
      const cleanText = text.replace(/`/g, '').trim();
      const parts = cleanText.split('|');

      if (parts.length < 4) {
        // Fallback if format is weird, map what we can
        setData({
          ipa: parts[0] || '...',
          explanation: parts[1] || text,
          gloss: parts[2] || '',
          example: parts[3] || ''
        });
      } else {
        setData({
          ipa: parts[0].trim(),
          explanation: parts[1].trim(),
          gloss: parts[2].trim(),
          example: parts[3].trim()
        });
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslation();
  }, [word]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[80%] md:w-[360px] bg-[#111318] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#111318]/95 backdrop-blur">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{word}</h2>
          <span className="text-xs text-purple-400 font-mono uppercase tracking-wider">Analysis</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {/* Loading State: Skeletons */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
               <div className="h-4 bg-white/10 rounded w-1/3"></div>
               <div className="h-4 bg-white/5 rounded w-1/4"></div>
            </div>
            <div className="space-y-3">
               <div className="h-20 bg-white/5 rounded-lg border border-white/5"></div>
               <div className="h-16 bg-white/5 rounded-lg border border-white/5"></div>
            </div>
            <div className="h-24 bg-purple-500/10 rounded-lg border border-purple-500/20"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
            <RefreshCw className="w-10 h-10 opacity-20" />
            <p>Could not load translation.</p>
            <button 
              onClick={fetchTranslation}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Data State */}
        {data && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* IPA & Phonetics */}
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-white/5 rounded text-gray-300 font-mono text-sm border border-white/10">
                {data.ipa}
              </div>
              <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-400 transition-colors">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* German Explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <BookOpen className="w-3 h-3" />
                <span>Bedeutung</span>
              </div>
              <p className="text-lg text-gray-100 font-medium leading-relaxed">
                {data.explanation}
              </p>
            </div>

            {/* English Gloss */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">In English</div>
              <p className="text-gray-300 italic">"{data.gloss}"</p>
            </div>

            {/* Context Example */}
            <div className="relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-30 group-hover:opacity-50 transition duration-500 blur"></div>
               <div className="relative p-5 bg-[#0B0A1F] rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Kontext</span>
                  </div>
                  <p className="text-white font-serif text-lg leading-relaxed">
                    "{data.example}"
                  </p>
               </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer / Decorative */}
      {!loading && !error && (
        <div className="p-6 border-t border-white/5 bg-[#111318] text-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">AI Dictionary • CEFR A2</p>
        </div>
      )}
    </div>
  );
}