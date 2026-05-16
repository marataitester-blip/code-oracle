"use client";

import React, { useState, useEffect } from 'react';
import FileTree from '@/components/FileTree';

interface FileEntry {
  path: string;
  type: 'blob' | 'tree';
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

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

  // Константа боевого адреса твоего Живого Таро
  const LIVE_VIEW_URL = "https://living-tarot.vercel.app/";

  // Кодекс Архитектора - Жесткие правила, которые автоматически склеиваются с каждым твоим промптом
  const CODE_ORACLE_DIRECTIVES = `
[СИСТЕМНЫЙРЕГЛАМЕНТДЛЯОРАКУЛА - ИЗМЕНЕНИЮ НЕ ПОДЛЕЖИТ]:
1. РАБОТА С КОДОМ: Выдавай измененные файлы ИСКЛЮЧИТЕЛЬНО целиком. Никаких сокращений, комментариев вроде "// остальной код без изменений" или многоточий. Только монолитный рабочий код.
2. МАСШТАБ ИЗМЕНЕНИЙ: Корректируй строго заявленную логику. Не упрощай дизайн, сохраняй исходную архитектуру, стили, анимации и подключения скриптов.
3. КРОСС-ДИРЕКТОРИАЛЬНЫЙ АНАЛИЗ И РЕФАКТОРИНГ: При получении задачи анализируй связи между папками (app, api, components). Если требуется убрать устаревшую механику — чисто удаляй её из всех связанных файлов. Если требуется изолировать механику — выноси её в отдельный независимый объект/компонент в соответствующую директорию и настраивай чистый импорт.
4. НАВИГАЦИЯ И СВЯЗИ: Автоматически создавай рабочие роуты и логические переходы между кнопками и новыми экранами, поддерживая целостность карты сайта.
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

    // Модифицируем промпт: незаметно для интерфейса вшиваем системный Кодекс Архитектора
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
        // Перезагружаем визор через небольшую паузу, чтобы Vercel успел подхватить билд
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

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      
      {/* ЛЕВАЯ ЧАСТЬ: Командный Центр Киллера Курсора */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-850">
        
        {/* Панель подключения к репозиторию Живого Таро */}
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

        {/* Рабочая зона: Радар файлов + Чат-Терминал */}
        <div className="flex-grow flex overflow-hidden">
          
          {/* Наш отлаженный Радар файлов */}
          <div className="w-2/5 h-full border-r border-gray-850">
            <FileTree files={files} onFileClick={handleFileClick} onCreateFile={handleCreateFile} />
          </div>

          {/* Инженерный Терминал (Чат с ИИ) */}
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
                      {msg.role === 'assistant' && msg.text.includes('```') && (
                        <button
                          onClick={() => {
                            const match = msg.text.match(/
http://googleusercontent.com/immersive_entry_chip/0

### 🛠 Инструкция по фиксации изменений:

1. Вставь этот код целиком в `src/app/page.tsx` на GitHub и нажми **Commit changes**.
2. Подожди примерно 60 секунд, пока Vercel пересоберет саму платформу управления `code-oracle`.
3. Зайди в интерфейс своего Оракула и обнови вкладку браузера.

**Что изменится принципиально:**
* Твой экран разделится ровно пополам. В правой части автоматически загрузится твоё работающее приложение `https://living-tarot.vercel.app/`.
* При отправке любого промпта (например: *«Перепиши меню, укрупни шрифты, убери иконки»*), система под капотом принудительно заставит ИИ анализировать связи между папками Живого Таро и выдать файл абсолютно целиком.
* После того как ты нажмешь «Материализовать», изменения уйдут на GitHub, Vercel обновит приложение, и через несколько секунд правая часть («Визор») покажет тебе обновленный интерфейс.

Заливай на GitHub, Марат. Собираем «Киллера Курсора» до победного конца. Дай знать, как пройдет сборка!
