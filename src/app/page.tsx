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

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
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
      <ul className="ml-2 border-l border-emerald-900/20 pl-2 mt-1 space-y-1 font-mono">
        {Object.keys(folders).sort().map(folderName => (
          <li key={folderName} className="text-gray-400 text-[10px]">
            <span className="text-emerald-700 font-bold opacity-60 cursor-default select-none">📁 {folderName}</span>
            {renderTree(pathPrefix ? `${pathPrefix}/${folderName}` : folderName, folders[folderName])}
          </li>
        ))}
        {currentLevelFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li 
            key={file.path} 
            className={`cursor-pointer text-[10px] py-0.5 break-all transition-all hover:text-emerald-400 ${activeFile === file.path ? 'text-emerald-300 font-bold bg-emerald-900/20 px-1' : 'text-gray-600'}`} 
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
      <h2 className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-3 select-none italic opacity-50 font-mono">Архитектура Проекта</h2>
      {justFiles.length > 0 ? renderTree('', justFiles) : <p className="text-gray-800 text-[9px] font-mono">Ожидание репозитория...</p>}
    </div>
  );
};

// --- ГЛАВНЫЙ ЭКРАН ПУЛЬТА (Киллер Курсора) ---
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
  
  // Телеметрия
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bufferBlink, setBufferBlink] = useState(false);

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
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Функция добавления логов
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time, message, type }]);
  };

  useEffect(() => { addLog("Система телеметрии активирована. Ожидание команд.", "system"); }, []);

  // Автоскроллы
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  // МЕТОД ЗЕРКАЛА
  useEffect(() => {
    if (!isConnected || files.length === 0) return;
    const targetPath = currentRoute === "" ? "src/app/page.tsx" : `src/app/${currentRoute}/page.tsx`;
    const found = files.find(f => f.path === targetPath);
    if (found && activeFile !== found.path) {
        handleFileClick(found.path);
    }
  }, [currentRoute, isConnected]);

  // Авто-сканер структуры страниц
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

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      
      if (!res.ok) {
        if (res.status === 405) {
          throw new Error("Ошибка 405: Vercel заблокировал запрос. Серверное API устарело.");
        }
        let errorData;
        try { errorData = JSON.parse(text); } catch(e) { errorData = { error: text }; }
        const errMsg = errorData.error || errorData.message || `Статус ${res.status}`;
        if (errMsg.includes("key") || errMsg.includes("token")) {
           throw new Error("Проблема авторизации GitHub. Проверьте GITHUB_PAT.");
        }
        throw new Error(errMsg);
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("Сервер прислал некорректный ответ (не JSON).");
      }
    } catch (e: any) {
      throw new Error(e.message || "Сбой связи с сервером.");
    }
  };

  const handleFileClick = async (path: string) => {
    setActiveFile(path);
    setIsLoading(true);
    addLog(`Запрос на чтение файла: ${path}...`, 'info');
    try {
      const data = await safeFetch(`/api/files?owner=${owner}&repo=${repo}&path=${path}`);
      setFileContent(data.content || '');
      addLog(`Файл загружен (${(data.content || '').length} байт).`, 'success');
    } catch (e: any) {
      addLog(`Сбой чтения: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputMessage('');
    setIsLoading(true);
    addLog(`Отправка запроса Оракулу...`, 'info');
    try {
      const data = await safeFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Файл: ${activeFile || 'Нет'}\nЗапрос: ${text}`,
          fileContext: activeFile ? { path: activeFile, content: fileContent } : null
        })
      });
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
      addLog(`Ответ Оракула получен.`, 'success');
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Сбой: ${e.message}` }]);
      addLog(`Сбой ИИ: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!activeFile) {
      addLog("Ошибка: Нет активного файла для материализации.", 'error');
      return;
    }
    if (!fileContent.trim()) {
      addLog("Ошибка: Буфер пуст. Запись отменена.", 'error');
      return;
    }
    
    setIsLoading(true);
    addLog(`Запуск PUSH для файла ${activeFile.split('/').pop()}...`, 'system');
    
    try {
      const data = await safeFetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: activeFile, content: fileContent })
      });
      
      if (data.success) {
        addLog(`PUSH выполнен. GitHub принял данные. Ожидание пересборки Vercel.`, 'success');
        setIframeKey(k => k + 1);
      }
    } catch (e: any) {
      addLog(`Критический сбой PUSH: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const extractCodeFromText = (text: string) => {
    if (!text.includes('```')) return null;
    const firstIndex = text.indexOf('```');
    const lastIndex = text.lastIndexOf('```');
    if (firstIndex !== lastIndex) {
      let code = text.substring(firstIndex + 3, lastIndex);
      const firstLineEnd = code.indexOf('\n');
      if (firstLineEnd !== -1 && firstLineEnd < 15 && !code.substring(0, firstLineEnd).includes('import')) {
        code = code.substring(firstLineEnd + 1);
      }
      return code.trim();
    }
    return null;
  };

  const applyToBuffer = (code: string) => {
    setFileContent(code);
    addLog(`Парсер: Извлечен код (${code.length} символов, ${code.split('\n').length} строк). Перенесен в буфер.`, 'success');
    
    // Эффект моргания
    setBufferBlink(true);
    setTimeout(() => setBufferBlink(false), 500);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    addLog(`Попытка подключения к ${owner}/${repo}...`, 'info');
    try {
      const data = await safeFetch(`/api/repo?owner=${owner}&repo=${repo}`);
      setFiles(data);
      setIsConnected(true);
      addLog(`Соединение установлено. Найдено ${data.length} узлов.`, 'success');
    } catch (e: any) {
      addLog(`Ошибка подключения: ${e.message}`, 'error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const centerView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.8);
  };

  // Подсчет строк буфера
  const bufferLinesCount = fileContent ? fileContent.split('\n').length : 0;

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans no-scrollbar">
      
      {/* ЛЕВАЯ ЧАСТЬ: МАСТЕРСКАЯ */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850">
        
        {/* Header */}
        <div className="h-14 p-3 bg-[#0d0d0d] border-b border-gray-800 flex gap-3 items-center flex-shrink-0 shadow-lg z-10">
          <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="bg-black border border-gray-700 rounded px-3 py-1.5 text-sm text-emerald-400 w-32 outline-none focus:border-emerald-600 transition-all font-mono" />
          <button onClick={handleConnect} disabled={isLoading} className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-4 py-2 rounded hover:bg-emerald-900 transition-all uppercase tracking-widest font-mono">
            {isLoading ? 'Загрузка...' : 'Подключить проект'}
          </button>
          {isConnected && <span className="text-emerald-500 font-mono text-[10px] animate-pulse font-bold">● LIVE</span>}
        </div>

        {/* Рабочая зона */}
        <div className="flex-grow flex min-h-0 overflow-hidden">
          {/* Хроники */}
          <div className="w-[180px] h-full flex-shrink-0 border-r border-gray-800 bg-[#080808]">
            <FileTree files={files} onFileClick={handleFileClick} activeFile={activeFile} />
          </div>
          
          {/* ЧАТ ОРАКУЛА */}
          <div className="flex-grow flex flex-col bg-[#070707] min-w-0">
            <div className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-10 select-none">
                  <div className="text-5xl mb-2">⚡</div>
                  <div className="text-[10px] uppercase tracking-[0.4em] font-bold font-mono">Система готова</div>
                </div>
              )}
              {messages.map((msg, i) => {
                const codeToApply = msg.role === 'assistant' ? extractCodeFromText(msg.text) : null;
                return (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                    <span className="text-[8px] text-gray-600 mb-1 font-bold uppercase tracking-widest font-mono">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                    <div className={`p-4 rounded-2xl text-base font-mono border ${msg.role === 'user' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300' : 'bg-[#0f0f0f] border-gray-800 text-gray-200'} max-w-[95%] shadow-xl leading-relaxed`}>
                      {msg.text}
                      {codeToApply && (
                        <button 
                          onClick={() => applyToBuffer(codeToApply)} 
                          className="mt-4 block w-full bg-emerald-600 hover:bg-emerald-500 text-black py-3 rounded-xl text-[10px] font-bold uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 font-mono"
                        >
                          Извлечь код в буфер
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Ввод */}
            <div className="p-4 bg-[#0d0d0d] border-t border-gray-800 shadow-2xl z-10">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите задачу..."
                className="w-full p-4 bg-black border border-gray-800 rounded-xl text-lg outline-none focus:border-emerald-600 resize-none h-32 text-gray-200 no-scrollbar shadow-inner placeholder:text-gray-800 font-mono leading-relaxed"
              />
              <div className="flex justify-between items-center mt-3">
                 <span className="text-[9px] text-yellow-600/50 font-mono truncate max-w-[50%] italic select-none">
                    {activeFile ? `Фокус: ${activeFile.split('/').pop()}` : 'Выберите файл в Хрониках'}
                 </span>
                 <button onClick={handleSendMessage} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-black px-10 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 disabled:opacity-50 tracking-widest shadow-lg font-mono">Отправить</button>
              </div>
            </div>
          </div>
        </div>

        {/* ТЕЛЕМЕТРИЯ (Системный журнал) */}
        <div className="h-24 border-t border-gray-800 bg-[#030303] flex flex-col z-20">
            <div className="px-4 py-1 border-b border-gray-800/50 flex justify-between bg-[#080808]">
                <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest font-mono">Терминал</span>
            </div>
            <div className="flex-grow p-2 overflow-y-auto no-scrollbar font-mono text-[9px] space-y-1">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                        <span className="text-gray-600">[{log.time}]</span>
                        <span className={`
                            ${log.type === 'info' ? 'text-gray-400' : ''}
                            ${log.type === 'success' ? 'text-emerald-500 font-bold' : ''}
                            ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                            ${log.type === 'system' ? 'text-blue-400 italic' : ''}
                        `}>{log.message}</span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>

        {/* БУФЕР (Нижняя часть) */}
        <div className="h-40 border-t border-gray-800 flex flex-col bg-black z-20">
          <div className="px-4 py-2 bg-[#0d0d0d] border-b border-gray-800 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-4">
               <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest font-mono">Буфер материализации</span>
               {fileContent && <span className="text-[9px] font-mono text-gray-500 border border-gray-800 rounded px-2 py-0.5">{bufferLinesCount} строк | {fileContent.length} симв.</span>}
            </div>
            {activeFile && (
              <button 
                onClick={handlePushToGitHub} 
                disabled={isLoading}
                className="bg-emerald-950 hover:bg-emerald-800 text-emerald-400 font-bold text-[9px] px-4 py-1.5 rounded border border-emerald-900 transition-all active:scale-95 disabled:opacity-50 font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                {isLoading ? 'ПРОЦЕСС...' : 'PUSH В GITHUB'}
              </button>
            )}
          </div>
          <div className={`flex-grow relative transition-colors duration-500 ${bufferBlink ? 'bg-emerald-900/40' : 'bg-[#030303]'}`}>
            <textarea 
              value={fileContent} 
              onChange={(e) => setFileContent(e.target.value)} 
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-gray-400 font-mono text-[10px] outline-none resize-none no-scrollbar leading-tight" 
              placeholder="Ожидание кода из Оракула..."
            />
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: ВИЗОР (Превью) */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {/* NAV */}
        <div className="h-14 p-3 bg-[#0d0d0d] border-b border-gray-800 flex items-center gap-4 z-20 shadow-lg">
          <div className="flex-grow flex items-center bg-black border border-gray-700 rounded px-3 py-1.5 min-w-0 transition-all focus-within:border-emerald-900">
            <span className="text-[9px] text-gray-600 font-bold mr-3 italic select-none font-mono uppercase tracking-tighter">NAV:</span>
            <select 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              className="bg-transparent text-emerald-400 text-xs font-mono outline-none mr-2 border-r border-gray-800 pr-2 cursor-pointer max-w-[150px]"
            >
              {appRoutes.map((r, i) => <option key={i} value={r.path} className="bg-black text-white">{r.label}</option>)}
            </select>
            <input type="text" value={currentRoute} onChange={(e) => setCurrentRoute(e.target.value)} placeholder="путь" className="bg-transparent text-emerald-400 text-xs font-mono outline-none flex-grow min-w-0" />
          </div>
          <button onClick={() => setIframeKey(k => k+1)} className="text-xl text-gray-600 hover:text-white transition-transform hover:rotate-180 duration-1000 p-1 font-mono">🔄</button>
        </div>

        {/* Пульт Визора */}
        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/90 backdrop-blur-xl border border-gray-800 p-2 rounded-xl flex flex-col gap-2 shadow-2xl pointer-events-auto border-t-white/5 font-mono">
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden p-0.5 shadow-inner">
            <button onClick={() => setViewMode('mobile')} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase transition-all ${viewMode === 'mobile' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase border-l border-gray-800 ${viewMode === 'desktop' ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>PC</button>
          </div>
          <div className="flex bg-black border border-gray-800 rounded-lg overflow-hidden p-0.5 shadow-inner">
            <button onClick={() => setIsPanMode(false)} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase transition-all ${!isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Cursor</button>
            <button onClick={() => setIsPanMode(true)} className={`flex-grow px-3 py-1 text-[8px] font-bold uppercase border-l border-gray-800 ${isPanMode ? 'bg-emerald-900/60 text-emerald-400' : 'text-gray-600'}`}>Hand</button>
          </div>
          <div className="flex items-center justify-between px-2 bg-black rounded-lg border border-gray-800 h-8 shadow-inner">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-gray-600 hover:text-white px-2 text-sm font-bold">-</button>
            <span className="text-[9px] font-mono text-gray-300 min-w-[30px] text-center font-bold">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} className="text-gray-600 hover:text-white px-2 text-sm font-bold">+</button>
            <button onClick={centerView} className="text-emerald-500 ml-2 text-[10px] hover:scale-125 transition-transform" title="Центрировать">⌖</button>
          </div>
        </div>

        {/* Холст Симуляции */}
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
              className={`flex flex-col shadow-[0_0_150px_rgba(0,0,0,1)] border-[#1a1a1a] transition-all duration-500 ${viewMode === 'mobile' ? 'bg-black rounded-[3.5rem] border-[12px] w-[390px] h-[844px]' : 'bg-black border-[3px] rounded-2xl w-[1280px] h-[720px]'}`} 
              style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}
            >
              {viewMode === 'mobile' && <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-20 pointer-events-none"><div className="w-40 h-8 bg-[#0a0a0a] rounded-b-3xl border-x border-b border-white/5 shadow-2xl font-mono"></div></div>}
              <iframe 
                key={`${viewMode}-${currentRoute}-${iframeKey}`} 
                src={`${LIVE_VIEW_URL}${currentRoute}`} 
                className="w-full flex-grow border-none bg-black transition-opacity duration-1000" 
                sandbox="allow-scripts allow-same-origin allow-forms" 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
