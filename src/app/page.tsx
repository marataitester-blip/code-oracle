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

// --- КОМПОНЕНТ FileTree (Компактная навигация) ---
interface FileTreeProps {
  files: FileEntry[];
  onFileClick: (path: string) => void;
  activeFile: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, activeFile }) => {
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
      <ul className="ml-2 border-l border-emerald-900/20 pl-2 mt-1 space-y-1">
        {Object.keys(folders).sort().map(folderName => (
          <li key={folderName} className="text-gray-400 text-[10px] font-mono">
            <span className="text-emerald-700 font-bold opacity-60">📁 {folderName}</span>
            {renderTree(pathPrefix ? `${pathPrefix}/${folderName}` : folderName, folders[folderName])}
          </li>
        ))}
        {currentLevelFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li 
            key={file.path} 
            className={`cursor-pointer text-[10px] font-mono py-0.5 break-all transition-all hover:text-emerald-400 ${activeFile === file.path ? 'text-emerald-300 font-bold bg-emerald-900/20' : 'text-gray-600'}`} 
            onClick={() => onFileClick(file.path)}
          >
            📄 {file.path.split('/').pop()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full h-full bg-[#080808] p-3 overflow-y-auto no-scrollbar">
      <h2 className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-3 select-none italic">Архитектура</h2>
      {justFiles.length > 0 ? renderTree('', justFiles) : <p className="text-gray-800 text-[9px]">Пусто</p>}
    </div>
  );
};

// --- ГЛАВНЫЙ ЭКРАН ПУЛЬТА ---
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
  
  // Визор
  const [zoom, setZoom] = useState(0.8);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  // Маршруты
  const [currentRoute, setCurrentRoute] = useState('');
  const [appRoutes, setAppRoutes] = useState<RouteEntry[]>([{ label: "🏠 Главная", path: "" }]);

  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Скролл чата
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // МЕТОД ЗЕРКАЛА (Связь Визора и Редактора)
  useEffect(() => {
    if (!isConnected || files.length === 0) return;
    const targetPath = currentRoute === "" ? "src/app/page.tsx" : `src/app/${currentRoute}/page.tsx`;
    const found = files.find(f => f.path === targetPath);
    if (found && activeFile !== found.path) handleFileClick(found.path);
  }, [currentRoute, isConnected]);

  // Сканер страниц
  useEffect(() => {
    if (files.length === 0) return;
    const generated: RouteEntry[] = [];
    files.forEach(f => {
      if (f.path.endsWith('page.tsx')) {
        let route = f.path.replace('src/app/', '').replace('page.tsx', '').replace(/\/$/, '');
        if (route === '' || route === 'src/app') generated.push({ label: "🏠 Главная", path: "" });
        else generated.push({ label: `📄 /${route}`, path: route });
      }
    });
    setAppRoutes(generated.sort((a,b) => a.path === "" ? -1 : 1));
  }, [files]);

  const handleFileClick = async (path: string) => {
    setActiveFile(path);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files?owner=${owner}&repo=${repo}&path=${path}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Файл: ${activeFile || 'Нет'}\nЗапрос: ${text}`,
          fileContext: activeFile ? { path: activeFile, content: fileContent } : null
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Сбой Оракула." }]);
    } finally { setIsLoading(false); }
  };

  const handlePush = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: activeFile, content: fileContent })
      });
      if (res.ok) {
        alert('МАТЕРИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        setIframeKey(k => k + 1);
      }
    } catch (e) { alert('Сбой записи!'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      
      {/* ЛЕВАЯ ЧАСТЬ: МАСТЕРСКАЯ (Инженерный пульт) */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850">
        
        {/* Header (Фикс) */}
        <div className="h-14 p-3 bg-[#0d0d0d] border-b border-gray-800 flex gap-3 items-center flex-shrink-0">
          <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="bg-black border border-gray-700 rounded px-3 py-1 text-sm text-emerald-400 w-32 outline-none" />
          <button onClick={() => {
              setIsLoading(true);
              fetch(`/api/repo?owner=${owner}&repo=${repo}`)
                .then(r => r.json()).then(d => { setFiles(d); setIsConnected(true); })
                .finally(() => setIsLoading(false));
          }} className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-4 py-1.5 rounded hover:bg-emerald-900 transition-all uppercase">Подключить</button>
          {isConnected && <span className="text-emerald-500 font-mono text-[10px] animate-pulse">● LIVE</span>}
        </div>

        {/* Рабочая зона (Flex-Grow) */}
        <div className="flex-grow flex min-h-0 overflow-hidden">
          {/* Файлы */}
          <div className="w-[180px] h-full flex-shrink-0 border-r border-gray-800">
            <FileTree files={files} onFileClick={handleFileClick} activeFile={activeFile} />
          </div>
          
          {/* ЧАТ */}
          <div className="flex-grow flex flex-col bg-[#070707] min-w-0">
            <div className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
              {messages.length === 0 && <div className="text-gray-800 text-[10px] text-center mt-10 uppercase tracking-[0.3em]">Оракул ожидает...</div>}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                   <span className="text-[8px] text-gray-600 mb-1 font-bold uppercase">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                   <div className={`p-4 rounded-2xl text-base font-mono border ${msg.role === 'user' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300' : 'bg-[#0f0f0f] border-gray-800 text-gray-200'} max-w-[95%] shadow-xl leading-relaxed`}>
                    {msg.text}
                    {msg.role === 'assistant' && msg.text.includes('```') && (
                      <button 
                        onClick={() => { 
                          const parts = msg.text.split('```');
                          if (parts.length >= 3) {
                              let code = parts[1];
                              const firstLine = code.indexOf('\n');
                              if (firstLine !== -1 && firstLine < 15 && !code.substring(0, firstLine).includes('import')) code = code.substring(firstLine + 1);
                              setFileContent(code.trim()); 
                              alert("КОД В БУФЕРЕ");
                          }
                        }} 
                        className="mt-4 block w-full bg-emerald-600 hover:bg-emerald-500 text-black py-3 rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg"
                      >
                        Применить код в буфер
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Ввод (Фикс высота внутри зоны) */}
            <div className="p-4 bg-[#0d0d0d] border-t border-gray-800">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Запрос..."
                className="w-full p-4 bg-black border border-gray-700 rounded-xl text-lg outline-none focus:border-emerald-600 resize-none h-40 text-gray-200 no-scrollbar shadow-inner leading-relaxed"
              />
              <div className="flex justify-between items-center mt-2">
                 <span className="text-[9px] text-yellow-600/50 font-mono truncate max-w-[50%]">{activeFile || 'Выберите файл'}</span>
                 <button onClick={handleSendMessage} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-black px-8 py-2 rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 disabled:opacity-50">Отправить</button>
              </div>
            </div>
          </div>
        </div>

        {/* Буфер (Фикс высота снизу) */}
        <div className="h-36 border-t border-gray-800 flex flex-col bg-black">
          <div className="px-4 py-1.5 bg-[#0d0d0d] border-b border-gray-800 flex justify-between items-center">
            <span className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">Буфер материализации</span>
            {activeFile && <button onClick={handlePush} className="bg-emerald-950 hover:bg-emerald-800 text-emerald-500 font-bold text-[9px] px-3 py-1 rounded border border-emerald-900">PUSH</button>}
          </div>
          <textarea 
            value={fileContent} 
            onChange={(e) => setFileContent(e.target.value)} 
            className="flex-grow p-3 bg-[#030303] text-gray-500 font-mono text-[9px] outline-none resize-none no-scrollbar cursor-default leading-tight" 
            readOnly 
          />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: ВИЗОР (Превью) */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative">
        
        {/* NAV */}
        <div className="h-14 p-3 bg-[#0d0d0d] border-b border-gray-800 flex items-center gap-3 z-20">
          <div className="flex-grow flex items-center bg-black border border-gray-700 rounded px-3 py-1.5 min-w-0">
            <span className="text-[9px] text-gray-600 font-bold mr-3 italic">NAV:</span>
            <select 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              className="bg-transparent text-emerald-400 text-xs font-mono outline-none mr-2 border-r border-gray-800 pr-2 cursor-pointer max-w-[120px]"
            >
              {appRoutes.map((r, i) => <option key={i} value={r.path} className="bg-black">{r.label}</option>)}
            </select>
            <input type="text" value={currentRoute} onChange={(e) => setCurrentRoute(e.target.value)} placeholder="путь" className="bg-transparent text-emerald-400 text-xs font-mono outline-none flex-grow min-w-0" />
          </div>
          <button onClick={() => setIframeKey(k => k+1)} className="text-xl text-gray-600 hover:text-white transition-all p-1">🔄</button>
        </div>

        {/* Пульт Визора */}
        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/90 backdrop-blur-xl border border-gray-800 p-2 rounded-xl flex flex-col gap-2 shadow-2xl pointer-events-auto">
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden p-0.5">
            <button onClick={() => setViewMode('mobile')} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase transition-all ${viewMode === 'mobile' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase border-l border-gray-800 ${viewMode === 'desktop' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>PC</button>
          </div>
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden p-0.5">
            <button onClick={() => setIsPanMode(false)} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase ${!isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Cursor</button>
            <button onClick={() => setIsPanMode(true)} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase border-l border-gray-800 ${isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Hand</button>
          </div>
          <div className="flex items-center justify-between px-2 bg-black rounded-lg border border-gray-800 h-8">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-gray-600 hover:text-white px-2 text-sm font-bold">-</button>
            <span className="text-[9px] font-mono text-gray-300 min-w-[30px] text-center">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} className="text-gray-500 hover:text-white px-2 text-sm font-bold">+</button>
          </div>
        </div>

        {/* Холст */}
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
              className={`flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] border-[#1a1a1a] transition-all duration-500 ${viewMode === 'mobile' ? 'bg-black rounded-[3rem] border-[12px] w-[390px] h-[844px]' : 'bg-black border-[3px] rounded-2xl w-[1280px] h-[720px]'}`} 
              style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}
            >
              {viewMode === 'mobile' && <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-20 pointer-events-none"><div className="w-32 h-6 bg-[#0a0a0a] rounded-b-2xl border border-white/5 shadow-2xl"></div></div>}
              <iframe key={`${viewMode}-${currentRoute}-${iframeKey}`} src={`${LIVE_VIEW_URL}${currentRoute}`} className="w-full flex-grow border-none bg-black" sandbox="allow-scripts allow-same-origin allow-forms" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
