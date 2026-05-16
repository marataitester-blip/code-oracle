"use client";

import React, { useState, useEffect } from 'react';

interface FileEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Встраиваем компонент FileTree напрямую
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
          <li key={folderName} className="text-gray-300 text-xs font-mono mt-1">
            <span className="text-emerald-500 font-bold opacity-80">📁 {folderName}</span>
            {renderTree(pathPrefix ? `${pathPrefix}/${folderName}` : folderName, folders[folderName])}
          </li>
        ))}
        {currentLevelFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li 
            key={file.path} 
            className="text-gray-400 hover:text-white cursor-pointer text-xs font-mono py-1 break-all transition-colors" 
            onClick={() => onFileClick(file.path)}
          >
            📄 {file.path.split('/').pop()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full bg-[#0a0a0a] p-4 overflow-y-auto border-r border-gray-800 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Хроники</h2>
        <button
          onClick={() => setShowNewFileInput(!showNewFileInput)}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-xl px-2"
          title="Создать файл"
        >
          +
        </button>
      </div>

      {showNewFileInput && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Например: app/page.tsx"
            className="flex-grow p-2 bg-black text-emerald-400 border border-gray-800 rounded text-xs outline-none focus:border-emerald-500 transition-colors"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button
            onClick={handleCreateFile}
            className="bg-emerald-900/30 hover:bg-emerald-800/80 text-emerald-400 font-bold py-1 px-3 rounded border border-emerald-800/50 transition-colors"
          >
            ✓
          </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto pr-2">
        {justFiles.length > 0 ? (
          renderTree('', justFiles)
        ) : (
          <p className="text-gray-600 text-xs text-center mt-10">Проект не подключен</p>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [owner, setOwner] = useState('marataitester-blip');
  const [repo, setRepo] = useState('Living-Tarot');
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Состояния визора
  const [zoom, setZoom] = useState(0.8);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // ФИЗИКА КАМЕРЫ И ИНТЕРАКТИВНОСТИ
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  // СОСТОЯНИЯ НАВИГАЦИИ И СОВЕТОВ
  const [currentRoute, setCurrentRoute] = useState('');
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);

  // Карта страниц Живого Таро (Оракул будет пополнять этот список при создании архитектуры)
  const APP_ROUTES = [
    { label: "🏠 Главная", path: "" },
    { label: "🔮 Карта Дня", path: "daily-card" },
    { label: "🥉 Медный уровень", path: "copper" },
    { label: "🥈 Серебряный уровень", path: "silver" },
    { label: "🥇 Золотой уровень (Сканер)", path: "gold" }
  ];

  // База знаний инженера (Советы Оракула)
  const ORACLE_TIPS = [
    "СОВЕТ: Всегда требуй от меня выдавать файлы целиком. Если Next.js увидит оборванный код, он сломает сборку на Vercel.",
    "СОВЕТ: Используй 'force-dynamic' в API-роутах, если данные (например, структура папок) должны быть свежими и не кэшироваться сервером.",
    "СОВЕТ: Если визор (телефон справа) не реагирует на клики, проверь, не включен ли режим 'Рука' на панели слева внизу.",
    "СОВЕТ: Архитектура 'Живого Таро' нелинейна. Если создаешь новую механику (например, Казначейство), сначала попроси меня описать структуру базы данных Prisma.",
    "СОВЕТ: Держи компоненты 'глупыми', а логику выноси в хуки. Это позволит легко переиспользовать карты Таро на разных экранах."
  ];

  const handleNextTip = () => {
    setActiveTipIndex((prev) => (prev + 1) % ORACLE_TIPS.length);
    setShowTip(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";

  const CODE_ORACLE_DIRECTIVES = `
[СИСТЕМНЫЙРЕГЛАМЕНТДЛЯОРАКУЛА - ИЗМЕНЕНИЮ НЕ ПОДЛЕЖИТ]:
1. РАБОТА С КОДОМ: Выдавай измененные файлы ИСКЛЮЧИТЕЛЬНО целиком. Никаких сокращений, комментариев вроде "// остальной код без изменений" или многоточий. Только монолитный рабочий код.
2. МАСШТАБ ИЗМЕНЕНИЙ: Корректируй строго заявленную логику. Не упрощай дизайн, сохраняй исходную архитектуру, стили, анимации и подключения скриптов.
3. КРОСС-ДИРЕКТОРИАЛЬНЫЙ АНАЛИЗ И РЕФАКТОРИНГ: При получении задачи анализируй связи между папками. Если требуется убрать устаревшую механику — чисто удаляй её из всех связанных файлов. Если требуется изолировать механику — выноси её в отдельный независимый объект/компонент.
4. НАВИГАЦИЯ И СВЯЗИ: Автоматически создавай рабочие роуты и логические переходы между кнопками и новыми экранами. При добавлении новых экранов напоминай пользователю обновить массив APP_ROUTES в интерфейсе пульта.
`;

  const fetchRepoStructure = async () => {
    if (!owner || !repo) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/repo?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
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
      const res = await fetch(`/api/files?owner=${owner}&repo=${repo}&path=${path}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (err) {
      alert('Не удалось загрузить содержимое файла');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = (fileName: string) => {
    setActiveFile(fileName);
    setFileContent('// Новый файл архитектуры Живого Таро\n');
    const newEntry: FileEntry = { path: fileName, type: 'blob' };
    setFiles(prev => [...prev, newEntry]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage('');
    setIsLoading(true);

    const fullyLoadedPrompt = `${CODE_ORACLE_DIRECTIVES}\n\nТекущий активный файл: ${activeFile || 'Не выбран'}\n\nЗапрос инженера:\n${userText}`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullyLoadedPrompt,
          fileContext: activeFile ? { path: activeFile, content: fileContent } : null
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Ошибка генерации ответа. Проверьте логи сервера.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCode = (code: string) => {
    setFileContent(code);
  };

  const handlePushToGitHub = async () => {
    if (!activeFile) return alert('Выберите или создайте целевой файл для материализации');
    setIsLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, path: activeFile, content: fileContent })
      });
      const data = await res.json();
      if (data.success) {
        alert('МАТЕРИАЛИЗАЦИЯ УСПЕШНА! Изменения отправлены в GitHub.');
        setTimeout(() => setIframeKey(prev => prev + 1), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(`Критический сбой коммита: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPanMode) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const centerView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.8);
  };

  const codeBlockMarker = '`' + '`' + '`';

  const targetWidth = viewMode === 'mobile' ? 390 : 1280;
  const targetHeight = viewMode === 'mobile' ? 844 : 720;

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      
      {/* ЛЕВАЯ ЧАСТЬ: Командный Центр */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850 z-20 bg-[#050505]">
        
        <div className="p-3 bg-[#0d0d0d] border-b border-gray-850 flex gap-2 items-center">
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="Репозиторий"
            className="bg-black border border-gray-800 rounded px-3 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-600 w-1/3"
          />
          <button
            onClick={fetchRepoStructure}
            disabled={isLoading}
            className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {isLoading ? "Загрузка..." : "Подключить Хроники"}
          </button>
          {isConnected && <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">ONLINE</span>}
        </div>

        <div className="flex-grow flex overflow-hidden">
          
          <div className="w-2/5 h-full border-r border-gray-850">
            <FileTree files={files} onFileClick={handleFileClick} onCreateFile={handleCreateFile} />
          </div>

          <div className="w-3/5 h-full flex flex-col bg-[#070707]">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-gray-600 text-xs space-y-2 mt-10 p-4 border border-gray-900 rounded bg-black/30">
                  <p className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Режим: Автоматический Анализ Архитектуры</p>
                  <p>Система готова к деструктуризации, изоляции объектов и чистке легаси-механик Живого Таро.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">{msg.role === 'user' ? 'Инженер' : 'Оракул'}</span>
                    <div className={`p-3 rounded text-xs whitespace-pre-wrap max-w-[95%] font-mono ${msg.role === 'user' ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-900/40' : 'bg-gray-900/50 text-gray-300 border border-gray-850'}`}>
                      {msg.text}
                      {msg.role === 'assistant' && msg.text.includes(codeBlockMarker) && (
                        <button
                          onClick={() => {
                            const regex = new RegExp(codeBlockMarker + '(?:tsx|typescript|javascript|html|css)?([\\s\\S]*?)' + codeBlockMarker);
                            const match = msg.text.match(regex);
                            if (match && match[1]) handleApplyCode(match[1].trim());
                          }}
                          className="mt-3 block w-full bg-emerald-900/40 hover:bg-emerald-800 text-emerald-400 font-bold py-1 px-2 rounded border border-emerald-700/50 text-[10px] transition-colors"
                        >
                          ПРИМЕНИТЬ КОД В РЕДАКТОР
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#0d0d0d] border-t border-gray-850 flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Запрос (например: 'Изолируй механику...')"
                className="flex-grow p-2 bg-black border border-gray-800 rounded text-xs outline-none focus:border-emerald-600 resize-none h-12 text-gray-300"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-4 rounded text-xs font-bold transition-colors"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>

        <div className="h-1/3 border-t border-gray-850 flex flex-col bg-black">
          <div className="p-2 bg-[#0d0d0d] border-b border-gray-850 flex justify-between items-center text-xs">
            <span className="font-mono text-[11px] text-gray-400">Активный файл: <span className="text-emerald-400">{activeFile || 'Не выбран'}</span></span>
            {activeFile && (
              <button
                onClick={handlePushToGitHub}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-4 py-1 rounded text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                МАТЕРИАЛИЗОВАТЬ (PUSH)
              </button>
            )}
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="flex-grow p-3 bg-[#030303] text-gray-300 font-mono text-xs outline-none resize-none overflow-y-auto leading-relaxed"
            placeholder="Здесь отобразится монолитный код выбранного файла Живого Таро..."
          />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Живой Визор с Навигатором и Плавающей Панелью */}
      <div className="w-1/2 h-full bg-[#111] flex flex-col relative overflow-hidden">
        
        {/* НАВИГАТОР СТРАНИЦ (Верхняя шапка) */}
        <div className="p-3 bg-[#0d0d0d] border-b border-gray-850 flex justify-between items-center z-20 relative shadow-md">
          <div className="flex items-center gap-3 w-2/3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            
            {/* Выпадающий список страниц */}
            <select
              value={currentRoute}
              onChange={(e) => setCurrentRoute(e.target.value)}
              className="bg-black border border-gray-800 text-emerald-400 text-xs font-mono rounded px-2 py-1 outline-none focus:border-emerald-600 cursor-pointer flex-grow"
            >
              {APP_ROUTES.map((route, idx) => (
                <option key={idx} value={route.path}>{route.label} (/{route.path})</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={handleNextTip}
              className="text-[10px] text-yellow-500 hover:text-yellow-400 border border-yellow-900/50 hover:bg-yellow-900/20 px-3 py-1.5 rounded transition-colors uppercase tracking-wider flex items-center gap-1 font-bold"
            >
              <span>💡</span> Совет ИИ
            </button>
            <button 
              onClick={() => setIframeKey(prev => prev + 1)}
              className="text-[10px] text-gray-400 hover:text-emerald-400 border border-gray-800 px-3 py-1.5 rounded transition-colors uppercase tracking-wider"
              title="Перезагрузить окно визора"
            >
              Обновить
            </button>

            {/* Всплывающее окно совета */}
            {showTip && (
              <div className="absolute top-10 right-0 w-64 bg-gray-900 border border-yellow-600/50 rounded-lg p-3 shadow-2xl z-50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">База Знаний</span>
                  <button onClick={() => setShowTip(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <p className="text-gray-300 text-xs font-mono leading-relaxed">{ORACLE_TIPS[activeTipIndex]}</p>
              </div>
            )}
          </div>
        </div>

        {/* ПЛАВАЮЩАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ (Нижний левый угол) */}
        <div className="absolute bottom-6 left-6 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border border-gray-800 p-2 rounded-xl shadow-2xl flex flex-col gap-2 pointer-events-auto">
          
          {/* Режимы Мобайл / ПК */}
          <div className="flex bg-black border border-gray-800 rounded overflow-hidden">
            <button 
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase w-1/2 transition-colors ${viewMode === 'mobile' ? 'bg-emerald-900/50 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Мобайл
            </button>
            <button 
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase w-1/2 border-l border-gray-800 transition-colors ${viewMode === 'desktop' ? 'bg-emerald-900/50 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              ПК
            </button>
          </div>

          {/* Интерактив / Рука */}
          <div className="flex bg-black border border-gray-800 rounded overflow-hidden">
            <button 
              onClick={() => setIsPanMode(false)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase w-1/2 transition-colors ${!isPanMode ? 'bg-emerald-900/50 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Стрелка
            </button>
            <button 
              onClick={() => setIsPanMode(true)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase w-1/2 border-l border-gray-800 transition-colors ${isPanMode ? 'bg-emerald-900/50 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Рука
            </button>
          </div>

          {/* Масштаб */}
          <div className="flex items-center bg-black border border-gray-800 rounded justify-between">
            <button 
              onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} 
              className="px-3 py-1 text-gray-500 hover:text-emerald-400 font-bold transition-colors"
            >−</button>
            <span className="text-[10px] text-gray-400 font-mono text-center py-1">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(4.0, z + 0.1))} 
              className="px-3 py-1 text-gray-500 hover:text-emerald-400 font-bold transition-colors"
            >+</button>
            <button 
              onClick={centerView} 
              className="px-3 py-1 text-emerald-500 hover:text-emerald-300 font-bold transition-colors border-l border-gray-800"
              title="Вернуть в центр"
            >⌖</button>
          </div>
        </div>

        {/* ИНТЕРАКТИВНЫЙ ХОЛСТ */}
        <div 
          className={`flex-grow bg-[#151515] overflow-hidden relative transition-colors ${isPanMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab hover:bg-[#1a1a1a]') : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isPanMode && <div className="absolute inset-0 z-30 bg-transparent" />}

          {/* ЯКОРЬ КАМЕРЫ */}
          <div 
            className="absolute top-1/2 left-1/2 z-10" 
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            {/* САМО ПРИЛОЖЕНИЕ С ДИНАМИЧЕСКИМ МАРШРУТОМ */}
            <div
              className={`flex-shrink-0 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] ${viewMode === 'mobile' ? 'bg-black rounded-[3rem] border-[12px] border-gray-900' : 'bg-black border border-gray-800 rounded-xl'}`}
              style={{
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
                transform: `translate(-50%, -50%) scale(${zoom})`,
                position: 'absolute'
              }}
            >
              {viewMode === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-7 flex justify-center pointer-events-none z-20">
                  <div className="w-40 h-7 bg-gray-900 rounded-b-3xl"></div>
                </div>
              )}

              {viewMode === 'desktop' && (
                <div className="w-full h-8 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-2 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
              )}

              <iframe
                key={`${viewMode}-${currentRoute}-${iframeKey}`}
                src={`${LIVE_VIEW_URL}${currentRoute}`}
                className={`w-full flex-grow border-none bg-black ${viewMode === 'mobile' ? 'pt-2' : ''}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                title={`Living Tarot Monitor - /${currentRoute}`}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
