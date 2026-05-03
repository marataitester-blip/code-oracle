"use client";

import React, { useState } from "react";
import CodeAltar from "../components/CodeAltar";
import OracleChat from "../components/OracleChat";
import FileTree from "../components/FileTree";

export default function CodeOracle() {
  const [repoInfo, setRepoInfo] = useState({ owner: "", repo: "" });
  const [files, setFiles] = useState<any[]>([]);
  const [currentCode, setCurrentCode] = useState("// Пространство для алхимии кода.\n// Подключи репозиторий и выбери файл.");
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Загрузка дерева файлов
  const loadRepoTree = async () => {
    if (!repoInfo.owner || !repoInfo.repo) return;
    try {
      const res = await fetch(`/api/github/tree?owner=${repoInfo.owner}&repo=${repoInfo.repo}`);
      const data = await res.json();
      if (Array.isArray(data)) setFiles(data);
    } catch (err) {
      console.error("Ошибка загрузки дерева:", err);
    }
  };

  // Чтение конкретного файла по клику
  const handleFileClick = async (path: string) => {
    setIsLoadingFile(true);
    setCurrentFilePath(path);
    try {
      const res = await fetch(
        `/api/github/content?owner=${repoInfo.owner}&repo=${repoInfo.repo}&path=${path}`
      );
      const data = await res.json();
      if (data.content) {
        setCurrentCode(data.content);
      } else if (data.error) {
        setCurrentCode(`// Ошибка: ${data.error}`);
      }
    } catch (err) {
      console.error("Ошибка при загрузке контента файла:", err);
      setCurrentCode("// Не удалось загрузить содержимое файла.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black text-gray-100">
      {/* Левая панель: Чат и Файлы */}
      <section className="w-1/3 min-w-[350px] max-w-[450px] flex flex-col border-r border-gray-800">
        <div className="p-4 bg-gray-900/50 border-b border-gray-800 space-y-2">
          <div className="flex gap-2">
            <input 
              placeholder="Владелец"
              className="w-1/2 bg-black border border-gray-800 p-2 text-xs rounded focus:border-purple-500 outline-none transition-all"
              onChange={(e) => setRepoInfo({...repoInfo, owner: e.target.value})}
            />
            <input 
              placeholder="Репозиторий"
              className="w-1/2 bg-black border border-gray-800 p-2 text-xs rounded focus:border-purple-500 outline-none transition-all"
              onChange={(e) => setRepoInfo({...repoInfo, repo: e.target.value})}
            />
          </div>
          <button 
            onClick={loadRepoTree}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs py-2 rounded font-bold transition-all shadow-lg shadow-purple-900/20"
          >
            ПОДКЛЮЧИТЬ ХРОНИКИ
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden flex flex-col">
            <div className="h-1/2 border-b border-gray-800">
                <OracleChat />
            </div>
            <div className="h-1/2 overflow-hidden">
                <FileTree files={files} onFileClick={handleFileClick} />
            </div>
        </div>
      </section>

      {/* Правая панель: Редактор */}
      <section className="flex-grow h-full relative">
        {isLoadingFile && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-purple-400 font-mono text-sm animate-pulse">Материализация кода...</div>
          </div>
        )}
        <div className="h-full">
           <CodeAltar 
              code={currentCode} 
              onChange={(val) => setCurrentCode(val || "")} 
              language={currentFilePath.endsWith('.py') ? 'python' : 'typescript'}
           />
        </div>
      </section>
    </main>
  );
}
