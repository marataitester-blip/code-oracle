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
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Хроники</h2>
        <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="text-emerald-400 hover:text-emerald-300 font-bold text-lg">+</button>
      </div>
      {showNewFileInput && (
        <div className="flex gap-1 mb-4">
          <input
            type="text"
            placeholder="Путь/Файл"
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

  // База реактивных советов
  const [advice, setAdvice] = useState("Подключите проект, чтобы получить первый совет инженера.");

  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";

  const CODE_ORACLE_DIRECTIVES = `
[СИСТЕМНЫЙРЕГЛАМЕНТДЛЯОРАКУЛА]:
1. Выдавай файлы ИСКЛЮЧИТЕЛЬНО целиком. 
2. Не упрощай дизайн и не удаляй существующую логику, если об этом не просили.
3. ПРИ СОЗДАНИИ НОВЫХ СТРАНИЦ: если создаешь роут (например, app/treasury/page.tsx), всегда сообщай пользователю полный URL (например, /treasury).
4. ИЗОБРАЖЕНИЯ: Если пользователь жалуется на изображения, проверь пути. В Next.js изображения из public/ должны вызываться через '/название.png'.
`;

  // Реактивная смена совета при выборе файла
  useEffect(() => {
    if (!activeFile) return;
    if (activeFile.endsWith('.css')) setAdvice("💡 СОВЕТ: Для неонового свечения используй box-shadow с несколькими слоями и полупрозрачные цвета (rgba).");
    else if (activeFile.includes('api/')) setAdvice("💡 СОВЕТ: Обязательно добавь 'export const dynamic = \"force-dynamic\"' в этот роут, чтобы GitHub не выдавал старые данные.");
    else if (activeFile.endsWith('.tsx')) setAdvice("💡 СОВЕТ: Если изображения не грузятся в визоре, убедись, что путь начинается с косой черты '/' (от корня public).");
    else setAdvice("💡 СОВЕТ: Разделяй логику и визуал. Если файл больше 200 строк — пора выносить механику в отдельный объект.");
  }, [activeFile]);

  const safeJsonParse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Ошибка протокола. Сервер вернул HTML вместо данных. Проверьте GITHUB_PAT в настройках Vercel.`);
    }
  };

  const fetchRepoStructure = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/repo?owner=${owner}&repo=${repo}`);
      const data = await safeJsonParse(res);
      if (data.error) throw new Error(data.error);
      setFiles(data);
      setIsConnected(true);
      setAdvice("💡 ПРОЕКТ В СЕТИ: Теперь выберите файл слева, чтобы начать модификацию или создать новый роут.");
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
      const data = await safeJsonParse(res);
      setFileContent(data.content || '');
    } catch (err: any) {
      alert(`Ошибка файла: ${err.message}`);
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
      const data = await safeJsonParse(res);
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
      setAdvice("💡 ИИ ОТВЕТИЛ: Если в ответе есть код, нажмите 'Применить', чтобы он попал в буфер внизу.");
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Ошибка: ${err.message}` }]);
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
      const data = await safeJsonParse(res);
      if (data.success) {
        alert('МАТЕРИАЛИЗАЦИЯ УСПЕШНА!');
        setTimeout(() => setIframeKey(prev => prev + 1), 5000);
      }
    } catch (err: any) {
      alert(`Сбой коммита: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Механика Space-зажима для Руки
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

  const targetWidth = viewMode === 'mobile' ? 390 : 1280;
  const targetHeight = viewMode === 'mobile' ? 844 : 720;

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans no-scrollbar">
      
      {/* ЛЕВАЯ ЧАСТЬ: Командный Центр */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850 z-20 bg-[#050505]">
        
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex gap-2 items-center flex-shrink-0">
          <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="bg-black border border-gray-800 rounded px-2 py-1 text-[10px] text-emerald-400 w-1/3 outline-none" />
          <button onClick={fetchRepoStructure} disabled={isLoading} className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded uppercase disabled:opacity-50 tracking-tighter">Подключить</button>
          {isConnected && <span className="text-[9px] text-emerald-500 font-mono">ONLINE</span>}
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/4 h-full border-r border-gray-850"><FileTree files={files} onFileClick={handleFileClick} onCreateFile={(f) => { setActiveFile(f); setFileContent('// Новая страница\n'); setFiles(prev => [...prev, {path: f, type:'blob'}]); }} /></div>
          
          <div className="w-3/4 h-full flex flex-col bg-[#070707]">
            {/* История чата */}
            <div className="flex-grow overflow-y-auto p-3 space-y-3 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-2 rounded text-[11px] font-mono border ${msg.role === 'user' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-gray-900 border-gray-850 text-gray-300'} max-w-[90%]`}>
                    {msg.text}
                    {msg.role === 'assistant' && msg.text.includes('```') && (
                      <button onClick={() => { const match = msg.text.match(/```[\s\S]*?\n([\s\S]*?)```/); if(match) setFileContent(match[1]); }} className="mt-2 block w-full bg-emerald-900/40 py-1 rounded text-[9px] font-bold uppercase">Применить код</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* БЛОК СОВЕТА (Интерактивный) */}
            <div className="mx-3 mb-1 p-2 bg-yellow-950/10 border border-yellow-900/30 rounded text-[10px] text-yellow-500/80 font-mono italic animate-pulse">
              {advice}
            </div>

            {/* ГИГАНТСКИЙ ПРОМПТ */}
            <div className="p-3 bg-[#0d0d0d] border-t border-gray-850 flex flex-col gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите новую страницу или изменение (ИИ предложит архитектуру и роут)..."
                className="w-full p-3 bg-black border border-gray-800 rounded text-xs outline-none focus:border-emerald-600 resize-none h-48 text-gray-300 no-scrollbar"
              />
              <button onClick={handleSendMessage} disabled={isLoading} className="bg-emerald-600 text-black px-4 py-2 rounded text-[10px] font-bold uppercase self-end">Генерировать</button>
            </div>
          </div>
        </div>

        {/* СЖАТЫЙ ТЕХНИЧЕСКИЙ КОД */}
        <div className="h-32 border-t border-gray-850 flex flex-col bg-black">
          <div className="px-2 py-1 bg-[#0d0d0d] border-b border-gray-850 flex justify-between items-center">
            <span className="text-[9px] text-gray-500 font-mono truncate">{activeFile || 'Буфер пуст'}</span>
            {activeFile && <button onClick={handlePushToGitHub} className="text-emerald-500 font-bold text-[9px] uppercase tracking-widest">Материализовать</button>}
          </div>
          <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="flex-grow p-2 bg-black text-gray-700 font-mono text-[9px] outline-none resize-none no-scrollbar cursor-default" readOnly />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Визор с Навигатором */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {/* НАВИГАТОР МАРШРУТОВ */}
        <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex items-center gap-2 z-20">
          <div className="flex-grow flex items-center bg-black border border-gray-800 rounded px-2 py-1">
            <span className="text-[9px] text-gray-600 font-bold mr-1">URL:</span>
            <span className="text-[9px] text-emerald-800 mr-1">living-tarot.vercel.app/</span>
            <input 
              type="text" 
              value={currentRoute} 
              onChange={(e) => setCurrentRoute(e.target.value)}
              placeholder="vash-marshrut (naprimer: copper)" 
              className="bg-transparent text-emerald-400 text-[10px] font-mono outline-none flex-grow"
            />
          </div>
          <button onClick={() => setIframeKey(k => k+1)} className="text-[9px] text-gray-500 border border-gray-800 px-2 py-1 rounded">Обновить</button>
        </div>

        {/* ПАНЕЛЬ В ЛЕВОМ НИЖНЕМ УГЛУ */}
        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/80 backdrop-blur border border-gray-800 p-2 rounded-lg flex flex-col gap-2 shadow-2xl">
          <div className="flex border border-gray-800 rounded overflow-hidden">
            <button onClick={() => setViewMode('mobile')} className={`px-2 py-1 text-[8px] uppercase ${viewMode === 'mobile' ? 'bg-emerald-900 text-emerald-400' : 'text-gray-500'}`}>Mob</button>
            <button onClick={() => setViewMode('desktop')} className={`px-2 py-1 text-[8px] uppercase border-l border-gray-800 ${viewMode === 'desktop' ? 'bg-emerald-900 text-emerald-400' : 'text-gray-500'}`}>PC</button>
          </div>
          <div className="flex border border-gray-800 rounded overflow-hidden">
            <button onClick={() => setIsPanMode(false)} className={`px-2 py-1 text-[8px] uppercase ${!isPanMode ? 'bg-emerald-900 text-emerald-400' : 'text-gray-500'}`}>Стрелка</button>
            <button onClick={() => setIsPanMode(true)} className={`px-2 py-1 text-[8px] uppercase border-l border-gray-800 ${isPanMode ? 'bg-emerald-900 text-emerald-400' : 'text-gray-500'}`}>Рука [Spc]</button>
          </div>
          <div className="flex items-center justify-between px-1 bg-black rounded border border-gray-800">
            <button onClick={() => setZoom(z => z - 0.1)} className="text-gray-500 hover:text-white px-1">-</button>
            <span className="text-[8px] font-mono">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => z + 0.1)} className="text-gray-500 hover:text-white px-1">+</button>
            <button onClick={() => {setPan({x:0, y:0}); setZoom(0.8);}} className="text-emerald-500 ml-1">⌖</button>
          </div>
        </div>

        {/* ХОЛСТ */}
        <div 
          className={`flex-grow bg-[#151515] relative overflow-hidden ${isPanMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          onMouseDown={(e) => { if(isPanMode) { setIsDragging(true); setDragStart({x: e.clientX - pan.x, y: e.clientY - pan.y}); } }}
          onMouseMove={(e) => { if(isDragging && isPanMode) setPan({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y}); }}
          onMouseUp={() => setIsDragging(false)}
        >
          {isPanMode && <div className="absolute inset-0 z-30 bg-transparent" />}
          <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div className={`flex flex-col shadow-2xl ${viewMode === 'mobile' ? 'bg-black rounded-[2.5rem] border-[10px] border-gray-900 w-[390px] h-[844px]' : 'bg-black border border-gray-800 rounded-lg w-[1280px] h-[720px]'}`} style={{ transform: `translate(-50%, -50%) scale(${zoom})`, position: 'absolute' }}>
              {viewMode === 'mobile' && <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20"><div className="w-32 h-6 bg-gray-900 rounded-b-2xl"></div></div>}
              <iframe key={`${viewMode}-${currentRoute}-${iframeKey}`} src={`${LIVE_VIEW_URL}${currentRoute}`} className={`w-full flex-grow border-none bg-black ${viewMode === 'mobile' ? 'pt-2' : ''}`} sandbox="allow-scripts allow-same-origin allow-forms" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
