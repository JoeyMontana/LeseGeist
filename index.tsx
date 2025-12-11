import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Type, Schema } from '@google/genai';
import { 
  Home, 
  BookOpen, 
  Library,
  User, 
  Settings, 
  Search, 
  Bell, 
  Play, 
  Info, 
  ChevronLeft,
  X,
  Loader2,
  Volume2,
  Headphones,
  Flame,
  Clock,
  Moon,
  Sun,
  Coffee,
  Battery,
  Bookmark,
  MoreHorizontal,
  Mic,
  PenTool
} from 'lucide-react';
import { BOOKS as INITIAL_BOOKS, CATEGORIES } from './constants';
import { Book, Category, ViewState, Brief, DraftBook } from './types';
import StudioCMS from './StudioCMS';
import WordSidebar from './WordSidebar';
import { STYLE_BIBLE } from './StyleBible';

// --- API & Config ---
// Backend not connected – placeholder
const ai = null;

// --- Helper: Retry Logic for Rate Limits ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  backoff = 2000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.code === 429 || error?.message?.includes('429'))) {
      console.warn(`Rate limit hit (429). Retrying in ${backoff}ms...`);
      await delay(backoff);
      return generateWithRetry(operation, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// --- Components ---

// 1. Sidebar Navigation
const Sidebar = ({ activeView, setView }: { activeView: ViewState, setView: (v: ViewState) => void }) => {
  const menuItems = [
    { icon: Home, label: 'Home', value: 'HOME' },
    { icon: Flame, label: 'Trending', value: 'POPULAR' },
    { icon: Headphones, label: 'Audiobooks', value: 'AUDIO' },
    { icon: Library, label: 'My Library', value: 'LIBRARY' },
    { icon: PenTool, label: 'Studio', value: 'STUDIO' }, // Added Studio tab
    { icon: User, label: 'Profile', value: 'PROFILE' },
  ];

  return (
    <div className="hidden md:flex flex-col w-24 lg:w-64 h-full bg-[#0B0A1F] border-r border-white/5 pt-8 pb-4 px-4 sticky top-0 flex-shrink-0 z-30">
      <div className="flex flex-col gap-8 h-full">
        {/* Logo area */}
        <div className="px-2 lg:px-4 mb-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 hidden lg:block tracking-tighter">
            LeseFluss
          </h1>
          <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.value as ViewState)}
              className={`flex items-center gap-4 px-2 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeView === item.value
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-6 h-6 ${activeView === item.value ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'}`} />
              <span className="font-medium hidden lg:block">{item.label}</span>
              {activeView === item.value && (
                <div className="ml-auto w-1 h-1 rounded-full bg-purple-500 hidden lg:block" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Setting */}
        <button className="flex items-center gap-4 px-2 lg:px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-6 h-6" />
          <span className="font-medium hidden lg:block">Setting</span>
        </button>
      </div>
    </div>
  );
};

// 2. Top Bar
const TopBar = () => {
  return (
    <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-20 bg-[#0B0A1F]/90 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-purple-500/50">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Willkommen</p>
          <p className="text-white font-semibold">Bookworm</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search authors, titles, genres..." 
            className="bg-[#18162E] text-sm text-white pl-10 pr-4 py-3 rounded-2xl w-80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-gray-500 border border-transparent focus:border-purple-500/30"
          />
        </div>
        <button className="relative p-2 rounded-full bg-[#18162E] hover:bg-[#252241] transition-colors">
          <Bell className="w-5 h-5 text-gray-300" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-[#18162E]"></span>
        </button>
      </div>
    </div>
  );
};

// 3. Hero Section
const Hero = ({ book, onRead }: { book: Book, onRead: (b: Book) => void }) => {
  if (!book) return null;
  return (
    <div className="relative rounded-3xl overflow-hidden mb-12 group mx-8 min-h-[500px] shadow-2xl shadow-black/50">
      <div className="absolute inset-0">
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0A1F] via-[#0B0A1F]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A1F] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 p-8 md:p-16 flex flex-col justify-center h-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">
                Top Pick
            </span>
             <span className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/20">
                {book.category}
            </span>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-none tracking-tight drop-shadow-xl">{book.title}</h2>
        
        <div className="flex items-center gap-6 text-gray-300 text-sm mb-8 font-medium">
            <span className="text-white text-lg">{book.author}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className={`px-2 py-0.5 rounded border ${
                book.difficulty === 'A1' || book.difficulty === 'A2' 
                ? 'text-green-400 border-green-500/30 bg-green-500/10' 
                : book.difficulty === 'B1' || book.difficulty === 'B2'
                ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>
                Level {book.difficulty}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {book.duration} mins
            </span>
        </div>
        
        <p className="text-gray-300 mb-10 line-clamp-3 leading-relaxed text-lg max-w-lg drop-shadow-md">
          {book.description}
        </p>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onRead(book)}
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded font-bold hover:bg-gray-200 transition-all transform hover:scale-105"
          >
            <BookOpen className="w-5 h-5 fill-current" />
            Read Now
          </button>
          <button className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded font-bold transition-all backdrop-blur-md">
            <Info className="w-5 h-5" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Book Card
const BookCard: React.FC<{ book: Book, onClick: () => void }> = ({ book, onClick }) => {
  return (
    <div 
      className="flex-shrink-0 w-[160px] md:w-[200px] group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/20 group-hover:shadow-2xl ring-1 ring-white/10 group-hover:ring-purple-500/50">
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="w-8 h-8 text-white mb-2" />
            <span className="text-white font-bold text-sm">Read Now</span>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] text-gray-300 font-medium uppercase tracking-wider">
                <span>{book.difficulty}</span>
                <span>{book.duration}m</span>
            </div>
        </div>

        {/* Static Level Badge (visible when not hovering) */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-sm border border-white/20 group-hover:opacity-0 transition-opacity">
            {book.difficulty}
        </div>
        
        {/* Progress bar if started */}
        {book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-red-600" style={{ width: `${book.progress}%` }} />
          </div>
        )}
      </div>
      
      <h3 className="text-gray-200 font-medium truncate group-hover:text-white transition-colors text-sm md:text-base">{book.title}</h3>
      <p className="text-gray-500 text-xs truncate">{book.author}</p>
    </div>
  );
};

// 5. Category Card
const CategoryCard: React.FC<{ category: Category }> = ({ category }) => {
  return (
    <div className="flex-shrink-0 relative w-[200px] h-[110px] rounded-lg overflow-hidden cursor-pointer group shadow-lg">
      <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-transparent mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 flex items-center p-4">
        <h3 className="text-white font-bold text-lg group-hover:translate-x-1 transition-transform">{category.name}</h3>
      </div>
    </div>
  );
};

// 6. Reader Interface (Full Width + Overlay Sidebar)
const Reader = ({ book, onClose }: { book: Book, onClose: () => void }) => {
  // Theme States: 'PAPER' (Cinematic Day) | 'CAMPFIRE' (Night)
  const [theme, setTheme] = useState<'PAPER' | 'CAMPFIRE'>('PAPER');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  
  // Psychology Levers
  const [shadowedWords, setShadowedWords] = useState<Set<string>>(new Set()); // Visual trail of conquest
  const [scrollProgress, setScrollProgress] = useState(book.progress || 8); // Start at 8% (Endowed Progress)
  const [timeMode, setTimeMode] = useState<'REAL' | 'SESSION'>('REAL');
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const paragraphs = book.content.split('\n');

  // --- Theme Styles ---
  const themeStyles = {
    PAPER: {
      bg: 'bg-[#fdfcf8] bg-noise',
      text: 'text-[#1a1a1a]',
      highlight: 'bg-purple-100/50 border-purple-800/20',
      selection: 'bg-[#008080]/20 underline decoration-[#008080]/40', // Desaturated Teal selection
    },
    CAMPFIRE: {
      bg: 'bg-[#18110e]', // Deep amber-black
      text: 'text-[#ffdca8]', // Warm light
      highlight: 'bg-[#ff9d5c]/10 border-[#ff9d5c]/20',
      selection: 'bg-[#008080]/30 underline decoration-[#008080]/60', // Desaturated Teal selection for night
    }
  };

  const currentTheme = themeStyles[theme];

  // --- Effects ---

  // Scroll Progress Listener
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const totalHeight = el.scrollHeight - el.clientHeight;
      const progress = (el.scrollTop / totalHeight) * 100;
      // Endowed progress: map 0-100 to 8-100 visual
      const visualProgress = 8 + (progress * 0.92); 
      setScrollProgress(Math.min(100, Math.max(8, visualProgress)));
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Session Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionMinutes(m => m + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[^\wäöüßÄÖÜ]/g, "");
    if (!cleanWord) return;

    // 1. Immediate Interaction
    setSelectedWord(cleanWord);
    setShadowedWords(prev => new Set(prev).add(cleanWord));
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking the container background directly
    if (e.target === e.currentTarget) {
        setSelectedWord(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#111318]">
        
        {/* === Immersion Lane (Full Width) === */}
        <div 
            className={`
                relative w-full h-full overflow-hidden flex flex-col transition-colors duration-700
                ${currentTheme.bg}
            `}
            onClick={() => setSelectedWord(null)} // Click outside to deselect
        >
            {/* Header (Minimal) */}
            <div className={`flex items-center justify-between px-6 py-4 z-10 ${theme === 'PAPER' ? 'bg-[#fdfcf8]/90' : 'bg-[#18110e]/90'} backdrop-blur-sm transition-colors duration-700`}>
                <button 
                  onClick={onClose} 
                  className={`p-2 rounded-full transition-colors ${theme === 'PAPER' ? 'hover:bg-black/5 text-gray-600' : 'hover:bg-white/10 text-[#ffdca8]'}`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                
                {/* Theme Toggle */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setTheme(prev => prev === 'PAPER' ? 'CAMPFIRE' : 'PAPER'); }}
                  className={`p-2 rounded-full transition-all duration-500 ${theme === 'PAPER' ? 'text-amber-600 hover:bg-amber-100' : 'text-amber-300 bg-amber-900/30'}`}
               >
                  {theme === 'PAPER' ? <Sun className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
               </button>
            </div>

            {/* Content Scroller */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 md:px-16 py-8 md:py-16 custom-scrollbar scroll-smooth"
              onClick={handleBackgroundClick}
            >
                {/* Book Title */}
                <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
                  <h1 className={`text-3xl md:text-5xl font-serif font-bold ${currentTheme.text} tracking-tight`}>
                    {book.title}
                  </h1>
                  <p className={`font-serif italic text-lg ${theme === 'PAPER' ? 'text-gray-500' : 'text-[#ffdca8]/60'}`}>
                    by {book.author}
                  </p>
                </div>

                {/* Text Body */}
                <div className={`space-y-8 font-serif text-xl md:text-2xl leading-loose tracking-wide ${currentTheme.text} max-w-2xl mx-auto transition-colors duration-700`}>
                    {paragraphs.map((para, pIndex) => {
                        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
                        return (
                            <p key={pIndex}>
                                {sentences.map((sentence, sIndex) => {
                                    const words = sentence.split(/(\s+)/);
                                    return (
                                        <React.Fragment key={sIndex}>
                                            {words.map((part, wIndex) => {
                                                const cleanPart = part.replace(/[^\wäöüßÄÖÜ]/g, "");
                                                const isWord = cleanPart.length > 0 && /[\wäöüßÄÖÜ]/.test(part);
                                                
                                                if (isWord) {
                                                    const isShadowed = shadowedWords.has(cleanPart);
                                                    const isSelected = selectedWord === cleanPart;
                                                    
                                                    return (
                                                        <span 
                                                            key={wIndex}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleWordClick(part);
                                                            }}
                                                            className={`
                                                                cursor-pointer rounded-[2px] px-0.5 mx-[-1px] transition-all duration-200 border-b-2
                                                                ${isSelected 
                                                                    ? `${currentTheme.selection} border-teal-500` 
                                                                    : 'border-transparent hover:bg-black/5'}
                                                                ${isShadowed && !isSelected 
                                                                    ? (theme === 'PAPER' ? 'border-purple-200 bg-purple-50/50' : 'border-[#ff9d5c]/20 bg-[#ff9d5c]/5') 
                                                                    : ''}
                                                            `}
                                                        >
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                                return <span key={wIndex}>{part}</span>;
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </p>
                        );
                    })}
                </div>
                <div className="h-32" /> {/* Overscroll buffer */}
            </div>
            
            {/* Footer Control Bar inside Immersion Lane */}
            <div className={`h-12 border-t ${theme === 'PAPER' ? 'bg-[#fdfcf8] border-gray-100' : 'bg-[#18110e] border-[#3a2818]'} flex items-center justify-between px-6 z-20 transition-colors duration-700 absolute bottom-0 w-full`}>
                 <button 
                    onClick={() => setTimeMode(prev => prev === 'REAL' ? 'SESSION' : 'REAL')}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${theme === 'PAPER' ? 'text-gray-400 hover:text-purple-600' : 'text-[#ffdca8]/40 hover:text-[#ff9d5c]'}`}
                 >
                    <Clock className="w-4 h-4" />
                    {timeMode === 'REAL' ? (
                      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span>{sessionMinutes} min</span>
                    )}
                 </button>
                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span>{Math.round(scrollProgress)}%</span>
                        <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-teal-500" style={{ width: `${scrollProgress}%` }} />
                        </div>
                     </div>
                 </div>
            </div>
        </div>

        {/* === Sidebar Overlay === */}
        {selectedWord && (
            <WordSidebar 
                word={selectedWord} 
                onClose={() => setSelectedWord(null)} 
            />
        )}
    </div>
  );
};


// 7. Main Home View
const HomeView = ({ books, onBookSelect }: { books: Book[], onBookSelect: (b: Book) => void }) => {
  const featuredBook = books[0];
  const beginnerBooks = books.filter(b => b.difficulty === 'A1' || b.difficulty === 'A2');
  const intermediateBooks = books.filter(b => b.difficulty === 'B1' || b.difficulty === 'B2');

  // Helper to render a section
  const Section = ({ title, books }: { title: string, books: Book[] }) => (
    <div className="px-8 mb-10">
        <div className="flex items-center justify-between mb-4 group">
            <h2 className="text-lg md:text-xl font-bold text-gray-100 group-hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                {title}
                <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">Explore all &gt;</span>
            </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x scroll-pl-8">
            {books.map(book => (
                <BookCard key={book.id} book={book} onClick={() => onBookSelect(book)} />
            ))}
             {/* Duplicate for visual fullness if list is short */}
            {books.length < 5 && books.map(book => (
                <BookCard key={`dup-${book.id}`} book={book} onClick={() => onBookSelect(book)} />
            ))}
        </div>
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar bg-[#0B0A1F]">
        <TopBar />
        
        {featuredBook && <Hero book={featuredBook} onRead={onBookSelect} />}

        {/* Categories Section */}
         <div className="px-8 mb-12">
            <h2 className="text-lg md:text-xl font-bold text-gray-100 mb-4">Browse by Genre</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {CATEGORIES.map(cat => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}
            </div>
        </div>

        <Section title="Beginner Friendly (A1-A2)" books={beginnerBooks} />
        <Section title="Intermediate & Advanced (B1-B2)" books={intermediateBooks} />
        <Section title="Trending Now" books={books} />

    </main>
  );
};


// 8. Root App Component
const App = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS); // Lifted state

  const handleStartReading = (book: Book) => {
    setReadingBook(book);
    setView('READER');
  };

  const handleCloseReader = () => {
    setReadingBook(null);
    setView('HOME');
  };

  // --- Gemini Generators for Studio (Wrapped with Retry) ---

  const generateTitles = async (brief: Brief & { pages: number, scene?: string }): Promise<string[]> => {
    if (!ai) {
        console.warn("AI waiting for backend");
        return [];
    }
    return generateWithRetry(async () => {
      const prompt = `${STYLE_BIBLE}
/////////////////////////////////////////////////////////////////////
Title-Engine v3 – Viral-Movie Brain
/////////////////////////////////////////////////////////////////////
Role: senior Netflix thumbnail copywriter + CEFR curriculum editor.  
Input: level=${brief.level}, genre=${brief.genre}, ≈${brief.pages} pages${brief.scene ? `, scene=${brief.scene}` : ''}.  
Output: 5 JSON strings only:  
["title1","title2","title3","title4","title5"]

Rules per title:  
- 1 noun-phrase, **NO dash**, ≤ 6 words, **unique metaphor or emotion**.  
- Genre twist table:  
  Krimi   → use **time pressure** or **body part** (Finger, Stunde, Herz).  
  Liebe   → use **forbidden object** or **weather** (Regen, Fahrschein, Glühwein).  
  Fantasy → use **contradiction** (Eis + Feuer, stummer Schrei).  
  Alltag  → use **absurd escalation** (Kaffeemaschine, 1 % Akku, falsche Tasche).  
- Avoid clichés: no “Geheimnisvolle”, “Tödliche”, “Gestohlener Ring”, “Verlorene Nachricht”.  
- Spark **morbid curiosity** or **empathy** → reader **must** click.  
- Still CEFR-friendly vocabulary (level hint in brackets).  
Examples:  
  A2 Krimi  → "Herz unter dem Tisch", "Stunde 23:59", "Finger im Kaffee".  
  A2 Liebe  → "Regen in ihrer Tasche", "Fahrschein nach nirgendwo".  
  B1 Fantasy→ "Eis, das singt", "Stumme Flammen", "Traum ohne Schlaf".  
/////////////////////////////////////////////////////////////////////
Generate 5 titles and return pure JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
             type: Type.ARRAY,
             items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text);
    });
  };

  const generateOutline = async (brief: Brief): Promise<string[]> => {
    if (!ai) {
        console.warn("AI waiting for backend");
        alert("Backend required for AI generation");
        return [];
    }
    return generateWithRetry(async () => {
      const prompt = `${STYLE_BIBLE}
      Act as a German book author. Create a chapter outline for a ${brief.level} level ${brief.genre} story.
      Target total word count: ${brief.wordCount}.
      
      IMPORTANT CHAPTER TITLE RULES:
      1. Max 3 words per title.
      2. Noun phrases only (e.g. "Alte Lampe", "Der Brief").
      3. NO numbering (no "Kapitel 1").
      4. NO subtitles or dashes.
      
      Return a JSON array of strings, where each string is a chapter title.
      Example: ["Der Anfang", "Die Reise", "Dunkler Wald"]
      Only return the JSON array.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
              }
          }
      });
      return JSON.parse(response.text);
    });
  };

  const generateChapter = async (title: string, brief: Brief): Promise<string> => {
    if (!ai) {
        console.warn("AI waiting for backend");
        return "Backend required to generate chapter content.";
    }
    return generateWithRetry(async () => {
      const prompt = `${STYLE_BIBLE}
      Write Chapter "${title}" for a German ${brief.genre} story (Level ${brief.level}).
      Style: Simple past tense (Präteritum), 90% active voice, simple sentence structure suitable for ${brief.level} learners.
      Include 5-10 challenging words but mostly keep it accessible.
      Return only the German text of the chapter.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      return response.text;
    });
  };

  const generateCover = async (sceneDescription: string): Promise<string> => {
      // NOTE: Using a placeholder service or text-to-image API if available.
      // Retrying extracting keywords just in case.
      if (!ai) {
        console.warn("AI waiting for backend");
        return "";
      }
      return generateWithRetry(async () => {
        const kwResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract 3 visual keywords (English) from this scene description for an image search, comma separated: "${sceneDescription}"`
        });
        const keywords = kwResponse.text.split(',').map(s => s.trim()).join(',');
        return `https://source.unsplash.com/800x1200/?${encodeURIComponent(keywords)}`;
      });
  };

  const generateSlug = async (title: string): Promise<string> => {
    if (!ai) {
        console.warn("AI waiting for backend");
        return "backend-required-slug";
    }
    return generateWithRetry(async () => {
      const prompt = `${STYLE_BIBLE}
      Task: Generate a URL-friendly SEO slug for the book title "${title}".
      Rule: Use kebab-case, lowercase, remove special characters, keep it under 6 words.
      Return only the slug string.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      return response.text.trim();
    });
  };

  const generateMeta = async (title: string, context: string): Promise<string> => {
    if (!ai) {
        console.warn("AI waiting for backend");
        return "Backend required for meta description.";
    }
    return generateWithRetry(async () => {
      const prompt = `${STYLE_BIBLE}
      Task: Write an SEO meta description for the book "${title}".
      Context: ${context.slice(0, 300)}...
      Rule: Max 160 characters. Compelling hook + primary keywords.
      Return only the description string.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      return response.text.trim();
    });
  };

  const handlePublishBook = async (draft: DraftBook) => {
    const fullContent = draft.chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
    const newBook: Book = {
        id: `gen-${Date.now()}`,
        title: draft.title,
        author: 'AI Author', // or User Name
        coverUrl: draft.coverUrl,
        category: draft.brief.genre,
        difficulty: draft.brief.level,
        description: draft.description,
        content: fullContent,
        duration: Math.round(draft.brief.wordCount / 200), // Approx 200 wpm
        progress: 0
    };
    
    setBooks(prev => [newBook, ...prev]);
    setView('HOME');
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0A1F] text-white overflow-hidden font-sans">
      {view === 'READER' && readingBook ? (
        <Reader book={readingBook} onClose={handleCloseReader} />
      ) : view === 'STUDIO' ? (
        <div className="flex w-full">
            <Sidebar activeView={view} setView={setView} />
            <StudioCMS 
                onGenerateOutline={generateOutline}
                onGenerateChapter={generateChapter}
                onGenerateCover={generateCover}
                onGenerateSlug={generateSlug}
                onGenerateMeta={generateMeta}
                onGenerateTitles={generateTitles} // Pass the centralized title generator
                onPublish={handlePublishBook}
                onCancel={() => setView('HOME')}
            />
        </div>
      ) : (
        <>
          <Sidebar activeView={view} setView={setView} />
          <HomeView books={books} onBookSelect={handleStartReading} />
        </>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);