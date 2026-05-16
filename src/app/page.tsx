"use client";

import React, { useState, useEffect, useRef } from 'react';

interface FileEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// --- КОМПОНЕНТ FileTree (Встроен для надежности сборки и устранения ошибок импорта) ---
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
      <ul className="ml-3 border-l border-gray-800 pl-2 mt-1 space-y-1">
        {Object.keys(folders).sort().map(folderName => (
          <li key={folderName} className="text-gray-300 text-[10px] font-mono mt-1">
            <span className="text-emerald-500 font-bold opacity-80 select-none">📁 {folderName}</span>
            {renderTree(pathPrefix ? `${pathPrefix}/${folderName}` : folderName, folders[folderName])}
          </li>
        ))}
        {currentLevelFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li 
            key={file.path} 
            className="text-gray-400 hover:text-white cursor-pointer text-[10px] font-mono py-1 break-all transition-colors" 
            onClick={() => onFileClick(file.path)}
          >
            📄 {file.path.split('/').pop()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full bg-[#0a0a0a] p-3 overflow-y-auto border-r border-gray-800 h-full flex flex-col no-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic select-none">Хроники Проекта</h2>
        <button 
          onClick={() => setShowNewFileInput(!showNewFileInput)} 
          className="text-emerald-400 hover:text-emerald-300 font-bold text-lg transition-transform active:scale-90"
        >
          +
        </button>
      </div>
      {showNewFileInput && (
        <div className="flex gap-1 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            placeholder="Путь/Файл.tsx"
            className="flex-grow p-1.5 bg-black border border-gray-800 rounded text-[10px] text-emerald-400 outline-none focus:border-emerald-600 transition-colors"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button onClick={handleCreateFile} className="bg-emerald-900/30 text-emerald-400 px-2 rounded hover:bg-emerald-800/50 transition-colors">✓</button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto no-scrollbar">
        {justFiles.length > 0 ? (
          renderTree('', justFiles)
        ) : (
          <div className="text-center mt-10 space-y-2">
            <p className="text-gray-700 text-[9px] uppercase tracking-widest">Проект не в сети</p>
            <p className="text-gray-800 text-[8px] italic">Нажмите "Подключить Хроники" выше</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ГЛАВНЫЙ ЭКРАН ПУЛЬТА (KILLER CURSOR) ---
export default function Home() {
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
  
  const [zoom, setZoom] = useState(0.8);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');

  // РЕАКТИВНЫЕ СОВЕТЫ ОРАКУЛА
  const [advice, setAdvice] = useState("Приветствую, Инженер. Подключите проект, чтобы я мог проанализировать архитектуру.");

  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";

  // Директивы для ИИ (Кодекс Архитектора)
  const CODE_ORACLE_DIRECTIVES = `
[СИСТЕМНЫЙРЕГЛАМЕНТДЛЯОРАКУЛА]:
1. Выдавай файлы ИСКЛЮЧИТЕЛЬНО целиком. Никаких сокращений.
2. Не упрощай дизайн.
3. Сообщай полный URL для новых страниц.
4. ПУТИ ИЗОБРАЖЕНИЙ: Используй абсолютные пути от корня (напр. '/cards/ace.png').
`;

  // Реактивность советов в зависимости от контекста
  useEffect(() => {
    if (!isConnected) return;
    if (!activeFile) {
        setAdvice("💡 Оракул: Проект подключен. Выберите файл в 'Хрониках' слева, чтобы я мог дать совет по его улучшению.");
        return;
    }
    
    if (activeFile.includes('page.tsx')) setAdvice("💡 Оракул: Вы работаете с главной логикой экрана. Помните, что изображения должны лежать в public/ и вызываться через '/image.png'.");
    else if (activeFile.endsWith('.css')) setAdvice("💡 Оракул: Для 'живого' эффекта Таро добавьте анимацию свечения через keyframes и фильтры drop-shadow.");
    else if (activeFile.includes('api/')) setAdvice("💡 Оракул: Это бэкенд. Если данные застряли — убедитесь, что в файле есть 'export const dynamic = \"force-dynamic\"'.");
    else setAdvice(`💡 Оракул: Работаем с ${activeFile.split('/').pop()}. Не забывайте про нелинейную структуру связей.`);
  }, [activeFile, isConnected]);

  // Улучшенный парсинг ответов с диагностикой 404
  const safeJsonParse = async (response: Response, url: string) => {
    const text = await response.text();
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Ошибка 404: Файл '${url}' не найден на сервере. Пожалуйста, убедитесь, что вы создали API-роуты в папке src/app/api/ в вашем GitHub.`);
        }
        throw new Error(`Ошибка API (${url}): Сервер вернул код ${response.status}. Возможно, Vercel требует пересборки (Redeploy).`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Сбой протокола на ${url}. Получен HTML вместо данных. Это верный признак отсутствия API-файлов в проекте.`);
    }
  };

  const fetchRepoStructure = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/repo?owner=${owner}&repo=${repo}`);
      const data = await safeJsonParse(res, '/api/repo');
      if (data.error) throw new Error(data.error);
      setFiles(data);
      setIsConnected(true);
    } catch (err: any) {
      alert(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (path: string) => {
    setActiveFile(path);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files?owner=${owner}&repo=${repo}&path=${path}`);
      const data = await safeJsonParse(res, '/api/files');
      setFileContent(data.content || '');
    } catch (err: any) {
      alert(err.message);
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${CODE_ORACLE_DIRECTIVES}\n\nФайл: ${activeFile || 'Нет'}\nЗапрос: ${userText}`,
          fileContext: activeFile ? { path: activeFile, content: fileContent } : null
        })
      });
      const data = await safeJsonParse(res, '/api/chat');
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Ошибка чата: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: activeFile, content: fileContent })
      });
      const data = await safeJsonParse(res, '/api/files [POST]');
      if (data.success) {
        alert('МАТЕРИАЛИЗАЦИЯ УСПЕШНА!');
        setTimeout(() => setIframeKey(prev => prev + 1), 5000);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция возврата камеры точно в центр (исправлено: восстановлено в коде)
  const centerView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.8);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsPanMode(true); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPanMode(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const codeBlockMarker = '`' + '`' + '`';

  const targetWidth = viewMode === 'mobile' ? 390 : 1280;
  const targetHeight = viewMode === 'mobile' ? 844 : 720;

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans no-scrollbar">
      
      {/* ЛЕВАЯ ЧАСТЬ: Мастерская */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850 z-20 bg-[#050505]">
        
        {/* Панель управления Хрониками */}
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex gap-2 items-center flex-shrink-0">
          <input 
            type="text" 
            value={repo} 
            onChange={(e) => setRepo(e.target.value)} 
            className="bg-black border border-gray-800 rounded px-2 py-1 text-[10px] text-emerald-400 w-1/3 outline-none focus:border-emerald-600 transition-colors" 
          />
          <button 
            onClick={fetchRepoStructure} 
            disabled={isLoading} 
            className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded uppercase disabled:opacity-50 tracking-tighter hover:bg-emerald-900 transition-colors"
          >
            {isLoading ? 'Загрузка...' : 'Подключить Хроники'}
          </button>
          {isConnected && <span className="text-[9px] text-emerald-500 font-mono animate-pulse select-none">● LIVE</span>}
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Дерево файлов */}
          <div className="w-1/4 h-full border-r border-gray-850 bg-[#080808]">
            <FileTree 
              files={files} 
              onFileClick={handleFileClick} 
              onCreateFile={(f) => { 
                setActiveFile(f); 
                setFileContent('// Новая структура архитектуры Живого Таро\n'); 
                setFiles(prev => [...prev, {path: f, type:'blob'}]); 
              }} 
            />
          </div>
          
          {/* Чат и Инженерный терминал */}
          <div className="w-3/4 h-full flex flex-col bg-[#070707]">
            <div className="flex-grow overflow-y-auto p-3 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                 <div className="text-gray-700 text-[10px] text-center mt-20 opacity-40 uppercase tracking-[0.3em] select-none">
                   Система готова к деструктуризации
                 </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                   <span className="text-[8px] text-gray-600 mb-1 uppercase font-mono tracking-widest">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                   <div className={`p-3 rounded-lg text-[11px] font-mono border ${msg.role === 'user' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300' : 'bg-gray-900 border-gray-850 text-gray-300'} max-w-[95%] shadow-lg leading-relaxed`}>
                    {msg.text}
                    {msg.role === 'assistant' && msg.text.includes(codeBlockMarker) && (
                      <button 
                        onClick={() => { 
                          const regex = new RegExp(codeBlockMarker + '[\\s\\S]*?\\n([\\s\\S]*?)' + codeBlockMarker);
                          const match = msg.text.match(regex); 
                          if(match) setFileContent(match[1]); 
                        }} 
                        className="mt-3 block w-full bg-emerald-900/40 hover:bg-emerald-800/60 py-2 rounded text-[9px] font-bold uppercase transition-all active:scale-95 border border-emerald-700/30"
                      >
                        Применить код в буфер материализации
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* РЕАКТИВНЫЙ СОВЕТ ОРАКУЛА */}
            <div className="mx-3 mb-1 p-2 bg-yellow-950/5 border border-yellow-900/20 rounded-md text-[10px] text-yellow-600/80 font-mono italic shadow-inner">
              {advice}
            </div>

            {/* ТЕРМИНАЛ ЗАПРОСОВ (Промпт) */}
            <div className="p-3 bg-[#0d0d0d] border-t border-gray-850 flex flex-col gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите изменение (например: 'Создай страницу реферальной системы')..."
                className="w-full p-4 bg-black border border-gray-800 rounded-lg text-sm outline-none focus:border-emerald-700 resize-none h-56 text-gray-300 no-scrollbar shadow-inner leading-relaxed transition-all"
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isLoading} 
                className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase self-end transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isLoading ? 'Генерация...' : 'Генерировать структуру'}
              </button>
            </div>
          </div>
        </div>

        {/* БУФЕР МАТЕРИАЛИЗАЦИИ (Код) */}
        <div className="h-24 border-t border-gray-850 flex flex-col bg-black">
          <div className="px-3 py-1.5 bg-[#0d0d0d] border-b border-gray-850 flex justify-between items-center">
            <span className="text-[9px] text-gray-500 font-mono italic truncate max-w-[70%]">{activeFile || 'Буфер материализации пуст'}</span>
            {activeFile && (
              <button 
                onClick={handlePushToGitHub} 
                className="text-emerald-500 font-bold text-[9px] uppercase hover:text-emerald-400 transition-colors tracking-widest animate-pulse"
              >
                Материализовать в GitHub
              </button>
            )}
          </div>
          <textarea 
            value={fileContent} 
            onChange={(e) => setFileContent(e.target.value)} 
            className="flex-grow p-3 bg-black text-gray-800 font-mono text-[9px] outline-none resize-none no-scrollbar cursor-default leading-tight" 
            readOnly 
          />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Визор (Симулятор) --- */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {/* НАВИГАТОР МАРШРУТОВ (NAV) */}
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex items-center gap-2 z-20 shadow-lg">
          <div className="flex-grow flex items-center bg-black border border-gray-800 rounded px-3 py-1.5 transition-all focus-within:border-emerald-800">
            <span className="text-[9px] text-gray-600 font-bold mr-2 italic select-none">NAV:</span>
            <span className="text-[9px] text-emerald-900 mr-1 select-none">living-tarot.vercel.app/</span>
            <input 
              type="text" 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              placeholder="vash-marshrut" 
              className="bg-transparent text-emerald-400 text-[10px] font-mono outline-none flex-grow"
            />
          </div>
          <button 
            onClick={() => setIframeKey(k => k+1)} 
            className="text-[12px] text-gray-500 hover:text-emerald-500 transition-all hover:rotate-180 duration-500"
            title="Перезагрузить визор"
          >
            🔄
          </button>
        </div>

        {/* ПУЛЬТ ВИЗОРА (Плавающая панель) */}
        <div className="absolute bottom-8 left-8 z-40 bg-[#0d0d0d]/90 backdrop-blur-xl border border-gray-800 p-2.5 rounded-2xl flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto border-t-white/5">
          <div className="flex bg-black border border-gray-800 rounded-xl overflow-hidden shadow-inner">
            <button onClick={() => setViewMode('mobile')} className={`px-3 py-1.5 text-[9px] font-bold uppercase transition-all ${viewMode === 'mobile' ? 'bg-emerald-900/50 text-emerald-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`px-3 py-1.5 text-[9px] font-bold uppercase border-l border-gray-800 transition-all ${viewMode === 'desktop' ? 'bg-emerald-900/50 text-emerald-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>PC</button>
          </div>
          <div className="flex bg-black border border-gray-800 rounded-xl overflow-hidden shadow-inner">
            <button onClick={() => setIsPanMode(false)} className={`px-3 py-1.5 text-[9px] font-bold uppercase transition-all ${!isPanMode ? 'bg-emerald-900/50 text-emerald-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>Курсор</button>
            <button onClick={() => setIsPanMode(true)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border-l border-gray-800 transition-all ${isPanMode ? 'bg-emerald-900/50 text-emerald-400 shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>Рука</button>
          </div>
          <div className="flex items-center justify-between px-2 bg-black rounded-xl border border-gray-800 shadow-inner h-8">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-gray-600 hover:text-white px-2 transition-colors font-bold">-</button>
            <span className="text-[9px] font-mono text-gray-400 min-w-[30px] text-center">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} className="text-gray-600 hover:text-white px-2 transition-colors font-bold">+</button>
            <button onClick={centerView} className="text-emerald-500 ml-1 text-[11px] hover:scale-125 transition-transform" title="Вернуть в центр">⌖</button>
          </div>
        </div>

        {/* ХОЛСТ СИМУЛЯТОРА */}
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
              className={`flex flex-col shadow-[0_0_120px_rgba(0,0,0,0.9)] transition-all duration-300 border-[#1a1a1a] ${viewMode === 'mobile' ? 'bg-black rounded-[3rem] border-[12px] w-[390px] h-[844px]' : 'bg-black border-[2px] rounded-2xl w-[1280px] h-[720px]'}`} 
              style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}
            >
              {viewMode === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
                  <div className="w-36 h-6 bg-[#0a0a0a] rounded-b-3xl border-x border-b border-white/5 shadow-2xl"></div>
                </div>
              )}
              <iframe 
                key={`${viewMode}-${currentRoute}-${iframeKey}`} 
                src={`${LIVE_VIEW_URL}${currentRoute}`} 
                className={`w-full flex-grow border-none bg-black transition-opacity duration-700 ${viewMode === 'mobile' ? 'pt-2' : ''}`} 
                sandbox="allow-scripts allow-same-origin allow-forms" 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
