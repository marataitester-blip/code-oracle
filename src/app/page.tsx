"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- ИНТЕРФЕЙСЫ ДАННЫХ ---
interface FileEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface RouteEntry {
  label: string;
  path: string;
}

// --- КОМПОНЕНТ FileTree (Хроники проекта) ---
interface FileTreeProps {
  files: FileEntry[];
  onFileClick: (path: string) => void;
  onCreateFile: (fileName: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, onCreateFile }) => {
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  const justFiles = files.filter(f => f.type === 'blob');

  const renderTree = (pathPrefix: string, fileList: FileEntry[]) => {
    const folders: { [key: string]: FileEntry[] } = {};
    const currentLevelFiles: FileEntry[] = [];

    fileList.forEach(file => {
      if (!file.path.startsWith(pathPrefix)) return;
      const relativePath = pathPrefix ? file.path.substring(pathPrefix.length + 1) : file.path;
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        const folderName = parts[0];
        if (!folders[folderName]) folders[folderName] = [];
        folders[folderName].push(file);
      } else {
        currentLevelFiles.push(file);
      }
    });

    return (
      <ul className="ml-4 border-l border-gray-800 pl-4 mt-2 space-y-3">
        {Object.keys(folders).sort().map(folderName => (
          <li key={folderName} className="text-gray-300 text-base font-mono mt-2">
            <span className="text-emerald-500 font-bold opacity-90 select-none">📁 {folderName}</span>
            {renderTree(pathPrefix ? `${pathPrefix}/${folderName}` : folderName, folders[folderName])}
          </li>
        ))}
        {currentLevelFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li 
            key={file.path} 
            className="text-gray-400 hover:text-white cursor-pointer text-base font-mono py-1.5 break-all transition-colors" 
            onClick={() => onFileClick(file.path)}
          >
            📄 {file.path.split('/').pop()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full bg-[#0a0a0a] p-4 overflow-y-auto border-r border-gray-800 h-full flex flex-col no-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest italic select-none">Хроники</h2>
        <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-emerald-400 hover:text-emerald-300 font-bold text-3xl transition-transform active:scale-90">+</button>
      </div>
      {showNewFileInput && (
        <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            placeholder="Путь/Файл.tsx"
            className="flex-grow p-3 bg-black border border-gray-800 rounded text-base text-emerald-400 outline-none focus:border-emerald-600 transition-colors"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button onClick={handleCreateFile} className="bg-emerald-900/30 text-emerald-400 px-6 py-2 rounded font-bold hover:bg-emerald-800 transition-colors">✓</button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto no-scrollbar">
        {justFiles.length > 0 ? renderTree('', justFiles) : (
          <div className="text-center mt-12">
             <p className="text-gray-700 text-sm uppercase tracking-widest">Проект не подключен</p>
             <p className="text-gray-800 text-xs italic mt-2">Нажмите кнопку сверху</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ГЛАВНЫЙ ЭКРАН КИЛЛЕРА КУРСОРA ---
export default function App() {
  const [owner] = useState('marataitester-blip');
  const [repo, setRepo] = useState('Living-Tarot');
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Визуальные настройки визора
  const [zoom, setZoom] = useState(0.8);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  // Навигация (Авто-диспетчер)
  const [currentRoute, setCurrentRoute] = useState('');
  const [appRoutes, setAppRoutes] = useState<RouteEntry[]>([
    { label: "🏠 Главная", path: "" }
  ]);

  const [advice, setAdvice] = useState("Подключите 'Живое Таро' для начала анализа архитектуры.");

  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";

  const centerView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.8);
  };

  // АВТОМАТИЧЕСКИЙ СКАНЕР МАРШРУТОВ
  useEffect(() => {
    if (files.length === 0) return;
    const generatedRoutes: RouteEntry[] = [];
    files.forEach(file => {
      if (file.path.endsWith('page.tsx')) {
        let routePath = file.path.replace('src/app/', '').replace('page.tsx', '');
        if (routePath.endsWith('/')) routePath = routePath.slice(0, -1);
        if (routePath === '' || routePath === 'src/app') {
          generatedRoutes.push({ label: "🏠 Главная", path: "" });
        } else {
          generatedRoutes.push({ label: `📄 /${routePath}`, path: routePath });
        }
      }
    });
    generatedRoutes.sort((a, b) => a.path === "" ? -1 : b.path === "" ? 1 : a.path.localeCompare(b.path));
    if (generatedRoutes.length > 0) setAppRoutes(generatedRoutes);
  }, [files]);

  // Реактивный совет Оракула
  useEffect(() => {
    if (!isConnected) return;
    if (!activeFile) {
        setAdvice("💡 Проект ONLINE. Выберите файл в Хрониках слева.");
        return;
    }
    if (activeFile.includes('page.tsx')) setAdvice("💡 Редактируем визуальный слой. Проверьте NAV-маршрут.");
    else if (activeFile.includes('api/')) setAdvice("💡 Внимание: это серверный API. Ошибки здесь положат всё приложение.");
    else setAdvice(`💡 Анализ объекта: ${activeFile.split('/').pop()}.`);
  }, [activeFile, isConnected]);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Ошибка API (${res.status}): ${text.substring(0, 100)}`);
      }
      return JSON.parse(text);
    } catch (e: any) {
      throw new Error(e.message || "Сбой связи с сервером.");
    }
  };

  const fetchRepoStructure = async () => {
    setIsLoading(true);
    try {
      const data = await safeFetch(`/api/repo?owner=${owner}&repo=${repo}`);
      setFiles(data);
      setIsConnected(true);
    } catch (err: any) {
      alert(`Ошибка подключения: ${err.message}`);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (path: string) => {
    setActiveFile(path);
    setIsLoading(true);
    try {
      const data = await safeFetch(`/api/files?owner=${owner}&repo=${repo}&path=${path}`);
      setFileContent(data.content || '');
    } catch (err: any) {
      alert(`Ошибка чтения файла: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const data = await safeFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Файл: ${activeFile || 'Нет'}\nЗапрос: ${userText}`,
          fileContext: activeFile ? { path: activeFile, content: fileContent } : null
        })
      });
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Сбой нейросети: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      const data = await safeFetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: activeFile, content: fileContent })
      });
      if (data.success) {
        alert('МАТЕРИАЛИЗАЦИЯ УСПЕШНА!');
        setTimeout(() => setIframeKey(k => k + 1), 5000);
      }
    } catch (err: any) {
      alert(`Сбой GitHub: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Механика Space (Рука)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsPanMode(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setIsPanMode(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Жесткий маркер для парсера
  const codeBlockMarker = '```';

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans no-scrollbar">
      
      {/* ЛЕВАЯ ЧАСТЬ: МАСТЕРСКАЯ (Крупные шрифты) */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-800 z-20 bg-[#050505]">
        
        {/* Верхняя панель управления */}
        <div className="p-4 bg-[#0d0d0d] border-b border-gray-800 flex gap-4 items-center flex-shrink-0 shadow-2xl">
          <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-base text-emerald-400 w-1/3 outline-none focus:border-emerald-500" />
          <button onClick={fetchRepoStructure} disabled={isLoading} className="bg-emerald-950 text-emerald-400 text-base font-bold px-6 py-3 rounded-lg hover:bg-emerald-900 transition-all uppercase tracking-tighter shadow-md">Подключить Хроники</button>
          {isConnected && <span className="text-base text-emerald-500 font-mono animate-pulse ml-2 font-bold">● LIVE</span>}
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Дерево файлов */}
          <div className="w-1/4 h-full border-r border-gray-800 bg-[#080808]">
            <FileTree files={files} onFileClick={handleFileClick} onCreateFile={(f) => { setActiveFile(f); setFiles(prev => [...prev, {path: f, type:'blob'}]); }} />
          </div>
          
          {/* Чат Оракула */}
          <div className="w-3/4 h-full flex flex-col bg-[#070707]">
            <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
              {messages.length === 0 && <div className="text-gray-700 text-base text-center mt-32 uppercase tracking-[0.4em] opacity-30 select-none italic font-serif">Оракул ожидает команд</div>}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-500`}>
                   <span className="text-xs text-gray-500 mb-2 uppercase font-mono tracking-widest">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                   <div className={`p-5 rounded-2xl text-lg font-mono border shadow-2xl ${msg.role === 'user' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-gray-900 border-gray-800 text-gray-200'} max-w-[95%] leading-relaxed`}>
                    {msg.text}
                    {msg.role === 'assistant' && msg.text.includes(codeBlockMarker) && (
                      <button 
                        onClick={() => { 
                          // УСИЛЕННЫЙ ПАРСЕР КОДА (МЕТОД СЕПАРАЦИИ)
                          const parts = msg.text.split(codeBlockMarker);
                          if (parts.length >= 3) {
                              // Берем всё, что между первым и последним блоком кавычек
                              let rawCode = parts[1];
                              // Отрезаем первую строку, если там название языка (react, typescript и т.д.)
                              const lines = rawCode.split('\n');
                              if (lines.length > 1 && lines[0].trim().length < 15 && !lines[0].includes(' ') && !lines[0].includes('import')) {
                                  rawCode = lines.slice(1).join('\n');
                              }
                              setFileContent(rawCode.trim()); 
                              alert("ИНФОРМАЦИЯ ПЕРЕДАНА В БУФЕР МАТЕРИАЛИЗАЦИИ");
                          } else {
                              alert("Оракул выдал неполный код. Попросите его повторить ответ целиком.");
                          }
                        }} 
                        className="mt-6 block w-full bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-xl text-base font-bold uppercase transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      >
                        Применить код в буфер
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Реактивный совет */}
            <div className="mx-6 mb-3 p-4 bg-yellow-950/10 border border-yellow-900/30 rounded-xl text-base text-yellow-500/90 font-mono italic shadow-inner">
              {advice}
            </div>

            {/* Терминал ввода */}
            <div className="p-5 bg-[#0d0d0d] border-t border-gray-800 flex flex-col gap-4 shadow-inner">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите желаемое изменение в Живом Таро..."
                className="w-full p-5 bg-black border border-gray-700 rounded-2xl text-xl outline-none focus:border-emerald-600 resize-none h-56 text-gray-200 no-scrollbar shadow-inner leading-relaxed transition-all placeholder:text-gray-700"
              />
              <button onClick={handleSendMessage} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-black px-12 py-4 rounded-2xl text-base font-bold uppercase self-end transition-all active:scale-95 shadow-lg disabled:opacity-50 tracking-widest">Отправить</button>
            </div>
          </div>
        </div>

        {/* БУФЕР МАТЕРИАЛИЗАЦИИ (Textarea внизу) */}
        <div className="h-64 border-t border-gray-800 flex flex-col bg-black shadow-2xl">
          <div className="px-5 py-3 bg-[#0d0d0d] border-b border-gray-800 flex justify-between items-center">
            <span className="text-sm text-gray-500 font-mono truncate italic select-none">Буфер материализации: <span className="text-emerald-500">{activeFile || 'Пусто'}</span></span>
            {activeFile && (
                <button 
                    onClick={handlePushToGitHub} 
                    className="bg-emerald-950 hover:bg-emerald-800 text-emerald-400 font-bold text-sm uppercase px-6 py-2 rounded-lg border border-emerald-700/30 transition-all shadow-md"
                >
                    Материализовать (PUSH)
                </button>
            )}
          </div>
          <textarea 
            value={fileContent} 
            onChange={(e) => setFileContent(e.target.value)} 
            className="flex-grow p-6 bg-[#030303] text-gray-400 font-mono text-sm outline-none resize-none no-scrollbar cursor-default leading-relaxed" 
            placeholder="Здесь появится код после нажатия 'Применить код в буфер' в чате..."
          />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: ЖИВОЙ ВИЗОР */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {/* NAV ПАНЕЛЬ */}
        <div className="p-4 bg-[#0d0d0d] border-b border-gray-800 flex items-center gap-4 z-20 shadow-2xl">
          <div className="flex-grow flex items-center bg-black border border-gray-700 rounded-xl px-4 py-3 transition-all focus-within:border-emerald-800">
            <span className="text-sm text-gray-600 font-bold mr-4 italic select-none">NAV:</span>
            <select 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              className="bg-transparent text-emerald-400 text-base font-mono outline-none mr-4 border-r border-gray-800 pr-4 cursor-pointer"
            >
              {appRoutes.map((r, i) => <option key={i} value={r.path} className="bg-black text-white">{r.label}</option>)}
            </select>
            <span className="text-base text-emerald-900 mr-2 select-none">/</span>
            <input type="text" value={currentRoute} onChange={(e) => setCurrentRoute(e.target.value)} placeholder="путь" className="bg-transparent text-emerald-400 text-base font-mono outline-none flex-grow" />
          </div>
          <button onClick={() => setIframeKey(k => k+1)} className="text-2xl text-gray-600 hover:text-white transition-all hover:rotate-180 duration-700 p-3" title="Обновить экран">🔄</button>
        </div>

        {/* --- КОМПАКТНАЯ ПАНЕЛЬ ВИЗОРА (В 4 раза меньше) --- */}
        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/90 backdrop-blur-xl border border-gray-800 p-2 rounded-xl flex flex-col gap-2 shadow-[0_15px_40px_rgba(0,0,0,0.8)] pointer-events-auto border-t-white/5">
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden shadow-inner p-0.5">
            <button onClick={() => setViewMode('mobile')} className={`flex-grow px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-md ${viewMode === 'mobile' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-500'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`flex-grow px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-md ${viewMode === 'desktop' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-500'}`}>PC</button>
          </div>
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden shadow-inner p-0.5">
            <button onClick={() => setIsPanMode(false)} className={`flex-grow px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-md ${!isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-500'}`}>Курсор</button>
            <button onClick={() => setIsPanMode(true)} className={`flex-grow px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-md ${isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-500'}`}>Рука</button>
          </div>
          <div className="flex items-center justify-between px-2 bg-black rounded-lg border border-gray-800 shadow-inner h-8">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-gray-500 hover:text-white px-2 text-sm transition-colors font-bold">-</button>
            <span className="text-[10px] font-mono text-gray-300 min-w-[35px] text-center font-bold">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} className="text-gray-500 hover:text-white px-2 text-sm transition-colors font-bold">+</button>
            <button onClick={centerView} className="text-emerald-500 ml-2 text-sm hover:scale-125 transition-transform" title="В центр">⌖</button>
          </div>
        </div>

        {/* ХОЛСТ СИМУЛЯЦИИ */}
        <div 
          className={`flex-grow bg-[#0c0c0c] relative overflow-hidden transition-colors ${isPanMode ? (isDragging ? 'cursor-grabbing scale-[0.99]' : 'cursor-grab') : ''}`}
          onMouseDown={(e) => { if(isPanMode) { setIsDragging(true); setDragStart({x: e.clientX - pan.x, y: e.clientY - pan.y}); } }}
          onMouseMove={(e) => { if(isDragging && isPanMode) setPan({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y}); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {isPanMode && <div className="absolute inset-0 z-30 bg-transparent" />}
          <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div 
              className={`flex flex-col shadow-[0_0_120px_rgba(0,0,0,1)] border-[#1a1a1a] transition-all duration-300 ${viewMode === 'mobile' ? 'bg-black rounded-[4rem] border-[14px] w-[390px] h-[844px]' : 'bg-black border-[3px] rounded-2xl w-[1280px] h-[720px]'}`} 
              style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}
            >
              {viewMode === 'mobile' && <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-20 pointer-events-none"><div className="w-40 h-8 bg-[#0a0a0a] rounded-b-[2rem] border-x border-b border-white/10 shadow-2xl"></div></div>}
              <iframe 
                key={`${viewMode}-${currentRoute}-${iframeKey}`} 
                src={`${LIVE_VIEW_URL}${currentRoute}`} 
                className={`w-full flex-grow border-none bg-black transition-opacity duration-700 ${viewMode === 'mobile' ? 'pt-4' : ''}`} 
                sandbox="allow-scripts allow-same-origin allow-forms" 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
