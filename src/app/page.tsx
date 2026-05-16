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

// --- КОМПОНЕНТ FileTree (Встроен для надежности сборки) ---
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
            <span className="text-emerald-500 font-bold opacity-80">📁 {folderName}</span>
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
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">Хроники Проекта</h2>
        <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-emerald-400 hover:text-emerald-300 font-bold text-lg">+</button>
      </div>
      {showNewFileInput && (
        <div className="flex gap-1 mb-4">
          <input
            type="text"
            placeholder="Путь/Файл.tsx"
            className="flex-grow p-1.5 bg-black text-emerald-400 border border-gray-800 rounded text-[10px] outline-none"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button onClick={handleCreateFile} className="bg-emerald-900/30 text-emerald-400 px-2 rounded">✓</button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto">{justFiles.length > 0 ? renderTree('', justFiles) : <p className="text-gray-700 text-[9px] text-center mt-10">Проект не в сети</p>}</div>
    </div>
  );
};

// --- ГЛАВНЫЙ ЭКРАН ПУЛЬТА ---
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

  // Директивы для ИИ (Кодекс)
  const CODE_ORACLE_DIRECTIVES = `
[СИСТЕМНЫЙРЕГЛАМЕНТДЛЯОРАКУЛА]:
1. Выдавай файлы ИСКЛЮЧИТЕЛЬНО целиком. Никаких сокращений.
2. Не упрощай дизайн.
3. Сообщай полный URL для новых страниц.
4. ПУТИ ИЗОБРАЖЕНИЙ: Используй абсолютные пути от корня (напр. '/cards/ace.png').
`;

  // Реактивность советов
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

  const safeJsonParse = async (response: Response, url: string) => {
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Ошибка API (${url}): Сервер вернул код ${response.status}. Возможно, Vercel требует пересборки (Redeploy) после настройки токена.`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Сбой протокола на ${url}. Получен HTML вместо данных. Проверьте переменные окружения GITHUB_PAT.`);
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
        
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex gap-2 items-center flex-shrink-0">
          <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="bg-black border border-gray-800 rounded px-2 py-1 text-[10px] text-emerald-400 w-1/3 outline-none" />
          <button onClick={fetchRepoStructure} disabled={isLoading} className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded uppercase disabled:opacity-50 tracking-tighter">Подключить Хроники</button>
          {isConnected && <span className="text-[9px] text-emerald-500 font-mono animate-pulse">● LIVE</span>}
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/4 h-full border-r border-gray-850">
            <FileTree files={files} onFileClick={handleFileClick} onCreateFile={(f) => { setActiveFile(f); setFileContent('// Новая структура\n'); setFiles(prev => [...prev, {path: f, type:'blob'}]); }} />
          </div>
          
          <div className="w-3/4 h-full flex flex-col bg-[#070707]">
            <div className="flex-grow overflow-y-auto p-3 space-y-3 no-scrollbar">
              {messages.length === 0 && (
                 <div className="text-gray-600 text-[10px] text-center mt-20 opacity-50 uppercase tracking-[0.2em]">Система готова к деструктуризации</div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <span className="text-[8px] text-gray-600 mb-1 uppercase font-mono">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                   <div className={`p-2 rounded text-[11px] font-mono border ${msg.role === 'user' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-300'} max-w-[95%] shadow-sm`}>
                    {msg.text}
                    {msg.role === 'assistant' && msg.text.includes(codeBlockMarker) && (
                      <button 
                        onClick={() => { 
                          const regex = new RegExp(codeBlockMarker + '[\\s\\S]*?\\n([\\s\\S]*?)' + codeBlockMarker);
                          const match = msg.text.match(regex); 
                          if(match) setFileContent(match[1]); 
                        }} 
                        className="mt-2 block w-full bg-emerald-900/40 hover:bg-emerald-800/50 py-1 rounded text-[9px] font-bold uppercase transition-colors"
                      >
                        Применить код в буфер
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-3 mb-1 p-2 bg-yellow-950/5 border border-yellow-900/20 rounded text-[10px] text-yellow-600/80 font-mono italic">
              {advice}
            </div>

            <div className="p-3 bg-[#0d0d0d] border-t border-gray-850 flex flex-col gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите желаемое изменение..."
                className="w-full p-3 bg-black border border-gray-800 rounded text-xs outline-none focus:border-emerald-600 resize-none h-56 text-gray-300 no-scrollbar shadow-inner leading-relaxed"
              />
              <button onClick={handleSendMessage} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded text-[10px] font-bold uppercase self-end transition-all active:scale-95 shadow-lg">Генерировать структуру</button>
            </div>
          </div>
        </div>

        <div className="h-24 border-t border-gray-850 flex flex-col bg-black">
          <div className="px-2 py-1 bg-[#0d0d0d] border-b border-gray-850 flex justify-between items-center">
            <span className="text-[9px] text-gray-500 font-mono italic truncate">{activeFile || 'Буфер материализации пуст'}</span>
            {activeFile && <button onClick={handlePushToGitHub} className="text-emerald-500 font-bold text-[9px] uppercase hover:text-emerald-400 transition-colors">Материализовать в GitHub</button>}
          </div>
          <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="flex-grow p-2 bg-black text-gray-800 font-mono text-[9px] outline-none resize-none no-scrollbar cursor-default" readOnly />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Визор */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex items-center gap-2 z-20">
          <div className="flex-grow flex items-center bg-black border border-gray-800 rounded px-2 py-1">
            <span className="text-[9px] text-gray-600 font-bold mr-1 italic">NAV:</span>
            <span className="text-[9px] text-emerald-900 mr-1 select-none">living-tarot.vercel.app/</span>
            <input 
              type="text" 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              placeholder="vash-marshrut" 
              className="bg-transparent text-emerald-400 text-[10px] font-mono outline-none flex-grow"
            />
          </div>
          <button onClick={() => setIframeKey(k => k+1)} className="text-[9px] text-gray-500 hover:text-white transition-colors">🔄</button>
        </div>

        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border border-gray-800 p-2 rounded-lg flex flex-col gap-2 shadow-2xl">
          <div className="flex border border-gray-800 rounded overflow-hidden">
            <button onClick={() => setViewMode('mobile')} className={`px-2 py-1 text-[8px] uppercase font-bold ${viewMode === 'mobile' ? 'bg-emerald-900 text-emerald-400' : 'text-gray-600'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`px-2 py-1 text-[8px] uppercase font-bold border-l border-gray-800 ${viewMode === 'desktop' ? 'bg-emerald-900 text-emerald-400' : 'text-gray-600'}`}>PC</button>
          </div>
          <div className="flex border border-gray-800 rounded overflow-hidden">
            <button onClick={() => setIsPanMode(false)} className={`px-2 py-1 text-[8px] uppercase font-bold ${!isPanMode ? 'bg-emerald-900 text-emerald-400' : 'text-gray-600'}`}>Курсор</button>
            <button onClick={() => setIsPanMode(true)} className={`px-2 py-1 text-[8px] uppercase font-bold border-l border-gray-800 ${isPanMode ? 'bg-emerald-900 text-emerald-400' : 'text-gray-600'}`}>Рука [Spc]</button>
          </div>
          <div className="flex items-center justify-between px-1 bg-black rounded border border-gray-800">
            <button onClick={() => setZoom(z => z - 0.1)} className="text-gray-600 hover:text-white px-1">-</button>
            <span className="text-[8px] font-mono text-gray-400 px-1">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => z + 0.1)} className="text-gray-600 hover:text-white px-1">+</button>
            <button onClick={() => {setPan({x:0, y:0}); setZoom(0.8);}} className="text-emerald-500 ml-1 text-[10px]">⌖</button>
          </div>
        </div>

        <div 
          className={`flex-grow bg-[#0a0a0a] relative overflow-hidden ${isPanMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          onMouseDown={(e) => { if(isPanMode) { setIsDragging(true); setDragStart({x: e.clientX - pan.x, y: e.clientY - pan.y}); } }}
          onMouseMove={(e) => { if(isDragging && isPanMode) setPan({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y}); }}
          onMouseUp={() => setIsDragging(false)}
        >
          {isPanMode && <div className="absolute inset-0 z-30 bg-transparent" />}
          <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div className={`flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all ${viewMode === 'mobile' ? 'bg-black rounded-[2.5rem] border-[10px] border-gray-900 w-[390px] h-[844px]' : 'bg-black border border-gray-800 rounded-lg w-[1280px] h-[720px]'}`} style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}>
              {viewMode === 'mobile' && <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20"><div className="w-32 h-6 bg-gray-900 rounded-b-2xl shadow-inner"></div></div>}
              <iframe key={`${viewMode}-${currentRoute}-${iframeKey}`} src={`${LIVE_VIEW_URL}${currentRoute}`} className={`w-full flex-grow border-none bg-black ${viewMode === 'mobile' ? 'pt-2' : ''}`} sandbox="allow-scripts allow-same-origin allow-forms" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
