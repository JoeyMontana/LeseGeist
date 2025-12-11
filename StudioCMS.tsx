import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Image as ImageIcon, 
  List, 
  FileText, 
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Link,
  Search,
  X,
  Type,
  AlertTriangle
} from 'lucide-react';
import { Brief, DraftBook, DraftChapter } from './types';
import { STYLE_BIBLE } from './StyleBible';

interface Props {
  onGenerateOutline: (b: Brief) => Promise<string[]>;
  onGenerateChapter: (title: string, brief: Brief) => Promise<string>;
  onGenerateCover?: (scene: string) => Promise<string>;
  onPublish: (book: DraftBook) => Promise<void>;
  
  // Optional generators
  onGenerateTitles?: (brief: Brief & { pages: number, scene?: string }) => Promise<string[]>;
  onGenerateSlug?: (title: string) => Promise<string>;
  onGenerateMeta?: (title: string, blurb: string) => Promise<string>;
  
  onCancel: () => void;
}

export default function StudioCMS({ 
  onGenerateOutline, 
  onGenerateChapter, 
  onGenerateCover, 
  onPublish,
  onGenerateTitles, 
  onGenerateSlug,
  onGenerateMeta,
  onCancel 
}: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Granular loading states
  const [genLoading, setGenLoading] = useState({
    title: false,
    slug: false,
    meta: false,
    cover: false
  });

  // --- Draft State ---
  const [pages, setPages] = useState(16);
  const [brief, setBrief] = useState<Brief>({
    level: 'A2',
    genre: 'Krimi',
    wordCount: 4000
  });

  const [outline, setOutline] = useState<string[]>([]);
  const [chapters, setChapters] = useState<DraftChapter[]>([]);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    slug: ''
  });

  // --- Title Picker State ---
  const [isPickingTitle, setIsPickingTitle] = useState(false);
  const [titleCandidates, setTitleCandidates] = useState<string[]>([]);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState<number | null>(null);

  // Sync pages to wordCount
  useEffect(() => {
    setBrief(prev => ({ ...prev, wordCount: pages * 250 }));
  }, [pages]);

  // Pre-fill cover prompt
  useEffect(() => {
    if (step === 4 && !coverPrompt && metadata.title) {
      setCoverPrompt(`A cinematic book cover for a ${brief.level} German ${brief.genre} book titled "${metadata.title}". High quality, minimalist, atmospheric.`);
    }
  }, [step, metadata.title, brief.genre, brief.level]);

  // --- Helpers ---

  const cleanChapterTitle = (raw: string): string => {
    let title = raw;
    title = title.replace(/^[\#\*\-\d\.\s]+/, ''); 
    title = title.replace(/^Kapitel \d+[:\.]?\s*/i, '');
    title = title.replace(/^Chapter \d+[:\.]?\s*/i, '');
    title = title.split(/[–—\-:]/)[0];
    title = title.replace(/[\*\_\[\]]/g, '');
    return title.trim();
  };
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Handlers ---

  const handleGenerateBatchTitles = async () => {
    setGenLoading(prev => ({ ...prev, title: true }));
    setIsPickingTitle(true);
    setSelectedTitleIdx(null);
    setTitleCandidates([]);

    try {
      const prompt = `Generate 5 creative German book titles for a ${brief.level} ${brief.genre} book. Output as JSON array of strings only.`;
      
      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      const text = await response.text();
      
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const titles = JSON.parse(cleanText);
      
      if (Array.isArray(titles)) {
        setTitleCandidates(titles.slice(0, 5));
      } else {
        throw new Error("Invalid format");
      }
    } catch (e: any) {
      console.error("Title generation failed", e);
      alert('Failed to generate titles.');
      setIsPickingTitle(false);
    } finally {
      setGenLoading(prev => ({ ...prev, title: false }));
    }
  };

  const confirmTitleSelection = () => {
    if (selectedTitleIdx !== null && titleCandidates[selectedTitleIdx]) {
      setMetadata(prev => ({ ...prev, title: titleCandidates[selectedTitleIdx] }));
      setIsPickingTitle(false);
    }
  };

  const handleGenerateOutline = async () => {
    setLoading(true);
    try {
      const generatedOutline = await onGenerateOutline(brief);
      if (!generatedOutline || generatedOutline.length === 0) {
        throw new Error("No outline generated");
      }
      const cleanedOutline = generatedOutline
        .map(cleanChapterTitle)
        .slice(0, 6);
      
      setOutline(cleanedOutline);
      setChapters(cleanedOutline.map((title, idx) => ({
        id: `ch-${idx}`,
        title,
        content: '',
        status: 'pending'
      })));
    } catch (e: any) {
      console.error(e);
      if (e?.status === 429 || e?.message?.includes('429')) {
         alert('Quota exceeded. Please wait a moment.');
      } else {
         alert('Failed to generate outline (Backend Required)');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChapter = async (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    if (!chapter) return;

    const newChapters = [...chapters];
    newChapters[chapterIndex] = { ...chapter, status: 'generating' };
    setChapters(newChapters);

    try {
      const content = await onGenerateChapter(chapter.title, brief);
      newChapters[chapterIndex] = { ...chapter, content, status: 'done' };
      setChapters([...newChapters]);
    } catch (e) {
      console.error(e);
      newChapters[chapterIndex] = { ...chapter, status: 'pending' };
      setChapters([...newChapters]);
    }
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt) return;
    setGenLoading(prev => ({ ...prev, cover: true }));
    try {
      // Cast import.meta to any to avoid "Property 'env' does not exist on type 'ImportMeta'" TS error
      const response = await fetch(`${(import.meta as any).env.VITE_COVER_URL}${encodeURIComponent(coverPrompt)}?width=768&height=1152`);
      if (response.ok) {
        const url = await response.text();
        setCoverUrl(url);
      } else {
        throw new Error('Image generation failed');
      }
    } catch (e) {
      console.error(e);
      alert('Bild fehlgeschlagen – nochmal');
    } finally {
      setGenLoading(prev => ({ ...prev, cover: false }));
    }
  };

  const handleGenerateSlug = async () => {
    if (!onGenerateSlug || !metadata.title) return;
    setGenLoading(prev => ({ ...prev, slug: true }));
    try {
      const slug = await onGenerateSlug(metadata.title);
      setMetadata(prev => ({ ...prev, slug: slug.trim().toLowerCase().replace(/\s+/g, '-') }));
    } catch (e) {
      console.error(e);
    } finally {
      setGenLoading(prev => ({ ...prev, slug: false }));
    }
  };

  const handleGenerateMeta = async () => {
    if (!onGenerateMeta || !metadata.title) return;
    setGenLoading(prev => ({ ...prev, meta: true }));
    try {
      const context = chapters[0]?.content?.slice(0, 200) || `A ${brief.genre} story.`;
      const desc = await onGenerateMeta(metadata.title, context);
      setMetadata(prev => ({ ...prev, description: desc }));
    } catch (e) {
      console.error(e);
    } finally {
      setGenLoading(prev => ({ ...prev, meta: false }));
    }
  };

  const handleFinalPublish = async () => {
    setLoading(true);
    try {
      const draftBook: DraftBook = {
        title: metadata.title || 'Untitled Book',
        brief,
        outline,
        chapters,
        coverUrl: coverUrl || 'https://via.placeholder.com/500x750',
        description: metadata.description,
        slug: metadata.slug
      };
      await onPublish(draftBook);
    } catch (e) {
      console.error(e);
      alert('Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Components ---

  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {[
        { n: 1, l: 'Brief' },
        { n: 2, l: 'Outline' },
        { n: 3, l: 'Chapters' },
        { n: 4, l: 'Cover' },
        { n: 5, l: 'Publish' }
      ].map((s) => (
        <div key={s.n} className="flex flex-col items-center gap-2 relative z-10">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 
              ${step >= s.n 
                ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-900/50' 
                : 'bg-[#18162E] border-gray-700 text-gray-500'}`}
          >
            {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
          </div>
          <span className={`text-xs font-medium uppercase tracking-wider ${step >= s.n ? 'text-purple-400' : 'text-gray-600'}`}>
            {s.l}
          </span>
        </div>
      ))}
      <div className="absolute top-[4.5rem] left-0 w-full h-0.5 bg-gray-800 -z-0 hidden md:block" /> 
      <div 
        className="absolute top-[4.5rem] left-0 h-0.5 bg-purple-600 transition-all duration-500 -z-0 hidden md:block" 
        style={{ width: `${((step - 1) / 4) * 100}%` }} 
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0A1F] overflow-hidden relative">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#0B0A1F]/95 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Studio CMS</h1>
            <p className="text-xs text-gray-400">AI-Powered Publishing Suite</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
          Exit Studio
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Backend Missing Banner */}
          <div className="mb-8 bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
             <div>
                <h3 className="text-yellow-500 font-bold text-sm">Backend Disconnected</h3>
                <p className="text-yellow-200/60 text-xs mt-1">AI generation features are disabled. Connect a backend to generate titles, outlines, and chapters automatically.</p>
             </div>
          </div>

          {renderProgressBar()}

          <div className="bg-[#18162E] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            {/* Step 1: Brief */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Project Brief</h2>
                  <p className="text-gray-400">Define the core parameters. Short books (8-32 pages) work best.</p>
                </div>

                {/* Top Row: Level & Genre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">CEFR Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['A1', 'A2', 'B1', 'B2'].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setBrief({ ...brief, level: lvl as any })}
                          className={`py-3 rounded-lg font-bold border-2 transition-all ${
                            brief.level === lvl 
                              ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                              : 'bg-[#0B0A1F] border-transparent text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Genre</label>
                    <select 
                      value={brief.genre}
                      onChange={(e) => setBrief({ ...brief, genre: e.target.value })}
                      className="w-full bg-[#0B0A1F] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none"
                    >
                      <option value="Krimi">Krimi (Crime)</option>
                      <option value="Liebe">Liebe (Romance)</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Märchen">Märchen (Fairy Tale)</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Geschichte">Geschichte (History)</option>
                    </select>
                  </div>
                </div>

                {/* Middle Row: Pages Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Rough Length (Pages)</label>
                    <span className="text-purple-400 font-mono">{pages} Pages</span>
                  </div>
                  <input 
                    type="range" 
                    min="8" 
                    max="32" 
                    step="2"
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>Short (8)</span>
                    <span>Standard (16)</span>
                    <span>Max (32)</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">AI may adjust flow for 4-6 chapters maximum.</p>
                </div>

                {/* Bottom Row: Title Generation */}
                <div className="space-y-3 pt-4 border-t border-white/5 relative">
                   <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Book Title</label>
                   
                   {!isPickingTitle ? (
                     <div className="flex gap-3">
                        <input 
                            type="text"
                            value={metadata.title}
                            onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                            placeholder="Enter title or generate titles..."
                            className="flex-1 bg-[#0B0A1F] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <button 
                          onClick={handleGenerateBatchTitles}
                          disabled={genLoading.title}
                          title="Generate Titles"
                          className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[160px] justify-center"
                        >
                           {genLoading.title ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                           Generate Titles
                        </button>
                     </div>
                   ) : (
                     /* Title Picker UI */
                     <div className="bg-[#111024] rounded-xl border border-purple-500/30 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                           <div>
                              <h3 className="text-white font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                Pick a Title
                              </h3>
                              <p className="text-xs text-gray-400">Pick one or regenerate – no clichés guaranteed.</p>
                           </div>
                           <button onClick={() => setIsPickingTitle(false)} className="text-gray-500 hover:text-white">
                             <X className="w-5 h-5" />
                           </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 mb-6">
                           {genLoading.title ? (
                              // Skeletons
                              Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                              ))
                           ) : (
                              titleCandidates.map((title, idx) => (
                                <label 
                                  key={idx}
                                  className={`
                                    flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                                    ${selectedTitleIdx === idx 
                                      ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                                      : 'bg-[#18162E] border-white/10 hover:border-white/30 hover:bg-white/5'}
                                  `}
                                >
                                  <input 
                                    type="radio" 
                                    name="titleCandidate"
                                    className="hidden" 
                                    checked={selectedTitleIdx === idx}
                                    onChange={() => setSelectedTitleIdx(idx)}
                                  />
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTitleIdx === idx ? 'border-purple-400' : 'border-gray-600'}`}>
                                     {selectedTitleIdx === idx && <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />}
                                  </div>
                                  <span className={`text-sm md:text-base font-medium ${selectedTitleIdx === idx ? 'text-white' : 'text-gray-300'}`}>
                                    {title}
                                  </span>
                                </label>
                              ))
                           )}
                        </div>

                        <div className="flex justify-end gap-3">
                           <button 
                              onClick={handleGenerateBatchTitles}
                              disabled={genLoading.title}
                              className="px-4 py-2 text-sm text-gray-400 hover:text-white flex items-center gap-2"
                           >
                              <RefreshCw className={`w-4 h-4 ${genLoading.title ? 'animate-spin' : ''}`} />
                              Regenerate batch
                           </button>
                           <button 
                              onClick={confirmTitleSelection}
                              disabled={selectedTitleIdx === null || genLoading.title}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              Use this Title
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* Step 2: Outline */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Story Outline</h2>
                    <p className="text-gray-400">Review the structure (Max 6 chapters).</p>
                  </div>
                  <button 
                    onClick={handleGenerateOutline}
                    disabled={loading}
                    title="Backend required"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {outline.length > 0 ? 'Regenerate' : 'Generate Outline'}
                  </button>
                </div>

                {outline.length > 0 ? (
                  <div className="space-y-3">
                    {outline.map((chapter, idx) => (
                      <div key={idx} className="flex gap-3 items-center group">
                        <span className="w-8 h-8 flex items-center justify-center rounded bg-white/5 text-gray-500 font-mono text-sm group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                          {idx + 1}
                        </span>
                        <input 
                          type="text" 
                          value={chapter}
                          onChange={(e) => {
                            const newOutline = [...outline];
                            newOutline[idx] = e.target.value;
                            setOutline(newOutline);
                            const newChapters = [...chapters];
                            if(newChapters[idx]) {
                                newChapters[idx].title = e.target.value;
                                setChapters(newChapters);
                            }
                          }}
                          className="flex-1 bg-transparent border-b border-gray-700 py-2 text-white focus:border-purple-500 outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-black/20 text-gray-500 gap-4">
                    <List className="w-12 h-12 opacity-20" />
                    <p>Click "Generate Outline" to start</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Chapters */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 h-[600px] flex flex-col">
                 <div>
                    <h2 className="text-2xl font-bold text-white">Chapter Content</h2>
                    <p className="text-gray-400">Generate and refine text.</p>
                  </div>

                  <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Chapter List */}
                    <div className="w-1/3 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {chapters.map((ch, idx) => (
                          <div key={ch.id} className="p-4 bg-[#0B0A1F] rounded-lg border border-white/5 hover:border-purple-500/30 transition-all group">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-gray-500">Chapter {idx + 1}</span>
                                {ch.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {ch.status === 'generating' && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
                             </div>
                             <h4 className="font-medium text-white mb-3 text-sm line-clamp-2 font-bold">{ch.title}</h4>
                             <button 
                                onClick={() => handleGenerateChapter(idx)}
                                disabled={ch.status === 'generating'}
                                title="Backend required"
                                className="w-full py-1.5 rounded bg-white/5 hover:bg-purple-600 hover:text-white text-xs text-gray-400 transition-colors"
                             >
                                {ch.status === 'done' ? 'Regenerate' : 'Generate'}
                             </button>
                          </div>
                        ))}
                    </div>

                    {/* Editor Preview */}
                    <div className="flex-1 bg-[#0B0A1F] rounded-lg border border-white/5 p-4 overflow-y-auto custom-scrollbar font-serif text-gray-300 leading-relaxed">
                        {chapters.some(c => c.content) ? (
                            <div className="space-y-8">
                                {chapters.map((ch, i) => ch.content && (
                                    <div key={i}>
                                        <h3 className="font-bold text-lg text-white mb-4">{ch.title}</h3>
                                        <div className="whitespace-pre-wrap">{ch.content}</div>
                                        <div className="my-8 h-px bg-white/5" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                <FileText className="w-16 h-16 opacity-20" />
                                <p>Select a chapter to generate content</p>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
            )}

            {/* Step 4: Cover */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-white">Cover Art</h2>
                  <p className="text-gray-400">Design a cinematic cover for your book.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Scene Description</label>
                        <textarea 
                            value={coverPrompt}
                            onChange={(e) => setCoverPrompt(e.target.value)}
                            className="w-full h-32 bg-[#0B0A1F] border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none resize-none"
                        />
                    </div>
                    <button 
                        onClick={handleGenerateCover}
                        disabled={genLoading.cover || !coverPrompt}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {genLoading.cover ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                        Generate Cover
                    </button>
                  </div>

                  <div className="w-full md:w-[300px] aspect-[2/3] bg-black/40 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group">
                    {coverUrl ? (
                        <>
                            <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-white font-bold text-center text-sm">{brief.genre}</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 p-6">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Preview will appear here</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Publish */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                 <div>
                  <h2 className="text-2xl font-bold text-white">Final Polish</h2>
                  <p className="text-gray-400">Prepare your metadata for SEO.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                         {/* Title (Read Only) */}
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Book Title</label>
                            <input 
                                type="text"
                                value={metadata.title}
                                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                                className="w-full bg-[#0B0A1F] border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            />
                         </div>

                         {/* Slug Generator */}
                         <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-300">SEO Slug</label>
                                <button 
                                    onClick={handleGenerateSlug}
                                    disabled={genLoading.slug}
                                    title="Backend required"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {genLoading.slug && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Auto-Generate
                                </button>
                            </div>
                            <div className="flex items-center bg-[#0B0A1F] border border-gray-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-purple-500">
                                <div className="pl-3 pr-2 text-gray-500 text-sm border-r border-gray-800 bg-white/5 h-full flex items-center">
                                    <Link className="w-3 h-3 mr-1" />
                                    /buch/
                                </div>
                                <input 
                                    type="text"
                                    value={metadata.slug}
                                    onChange={(e) => setMetadata({...metadata, slug: e.target.value})}
                                    placeholder="your-book-slug"
                                    className="flex-1 bg-transparent p-3 text-white focus:outline-none placeholder-gray-600"
                                />
                            </div>
                         </div>

                         {/* Meta Generator */}
                         <div className="space-y-2">
                             <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-300">Meta Description</label>
                                <button 
                                    onClick={handleGenerateMeta}
                                    disabled={genLoading.meta}
                                    title="Backend required"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {genLoading.meta && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Auto-Generate
                                </button>
                            </div>
                            <textarea 
                                value={metadata.description}
                                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                                className="w-full h-32 bg-[#0B0A1F] border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none resize-none placeholder-gray-600"
                                placeholder="A catchy description for Google..."
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{metadata.description.length} / 160 chars</span>
                                <span className={metadata.description.length > 160 ? 'text-red-500' : 'text-green-500'}>
                                    {metadata.description.length > 160 ? 'Too Long' : 'Optimal'}
                                </span>
                            </div>
                         </div>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-[#0B0A1F] p-6 rounded-xl border border-white/5 h-fit">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                             <Search className="w-4 h-4" />
                             <span className="text-xs font-mono">Google Search Preview</span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-[#8ab4f8] text-lg hover:underline cursor-pointer truncate">{metadata.title || 'Your Book Title'} | LeseFluss</h3>
                            <div className="text-green-400 text-xs mb-1">https://lesefluss.com/buch/{metadata.slug || 'slug'}</div>
                            <p className="text-gray-400 text-sm line-clamp-2">{metadata.description || 'This is how your book will appear in search results. Write a compelling description to attract more readers.'}</p>
                        </div>
                        
                        <div className="h-px bg-white/10 my-4" />

                        <div className="flex gap-4">
                            <div className="w-20 aspect-[2/3] bg-gray-800 rounded overflow-hidden">
                                {coverUrl ? <img src={coverUrl} className="w-full h-full object-cover" /> : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black" />
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="text-white font-bold text-sm">{metadata.title || 'Untitled'}</h4>
                                <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700 uppercase">{brief.level}</span>
                                    <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700 uppercase">{brief.genre}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || loading}
              className="px-6 py-3 rounded-lg text-gray-400 hover:text-white disabled:opacity-0 transition-all flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {step < 5 ? (
               <button
                onClick={() => setStep(step + 1)}
                disabled={loading || (step === 1 && !metadata.title) || (step === 2 && outline.length === 0)}
                className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
                <button
                onClick={handleFinalPublish}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Publish Book
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}