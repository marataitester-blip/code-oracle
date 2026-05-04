"use client";

import React, { useState } from "react";
import CodeAltar from "../components/CodeAltar";
import OracleChat from "../components/OracleChat";
import FileTree from "../components/FileTree";

export default function CodeOracle() {
  const [repoInfo, setRepoInfo] = useState({ owner: "", repo: "" });
  const [files, setFiles] = useState<any[]>([]);
  const [currentCode, setCurrentCode] = useState("// Пространство для алхимии кода.\n// Выбери файл для начала.");
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [isPushing, setIsPushing] = useState(false);

  // Загрузка дерева файлов
  const loadRepoTree = async () => {
    if (!repoInfo.owner || !repoInfo.repo) return;
    try {
        const res = await fetch(`/api/github/tree?owner=${repoInfo.owner}&repo=${repoInfo.repo}`);
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
    } catch (e) {
        console.error("Ошибка загрузки дерева");
    }
  };

  // Открытие существующего файла
  const handleFileClick = async (path: string) => {
    setCurrentFilePath(path);
    const res = await fetch(`/api/github/content?owner=${repoInfo.owner}&repo=${repoInfo.repo}&path=${path}`);
    const data = await res.json();
    if (data.content) {
        setCurrentCode(data.content);
    } else {
        setCurrentCode(`// Не удалось загрузить содержимое. Возможно, это бинарный файл или изображение.`);
    }
  };

  // Подготовка к созданию нового файла
  const handleCreateFile = (path: string) => {
    setCurrentFilePath(path);
    setCurrentCode(`// Новый файл: ${path}\n// Опиши Оракулу, что здесь должно быть, или напиши код сам.\n// После применения кода нажми "МАТЕРИАЛИЗОВАТЬ (PUSH)".`);
  };

  // Отправка кода в GitHub
  const handlePush = async () => {
    if (!currentFilePath) return alert("Сначала выбери файл!");
    setIsPushing(true);
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        body: JSON.stringify({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          path: currentFilePath,
          content: currentCode,
          message: `Оракул: обновление ${currentFilePath}`
        }),
      });
      if (res.ok) {
          alert("Материализация успешна! Код на GitHub.");
          loadRepoTree(); // Обновляем дерево, чтобы новый файл появился в списке
      } else {
          const err = await res.json();
          alert(`Ошибка: ${err.error}`);
      }
    } catch (e) {
      alert("Ошибка материализации");
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black text-gray-100 font-mono">
      <section className="w-1/3 min-w-[350px] flex flex-col border-r border-gray-800">
        <div className="p-4 bg-gray-900 border-b border-gray-800 space-y-2">
          <input 
            placeholder="Владелец (GitHub ID)" 
            className="w-full bg-black border border-gray-800 p-2 text-[10px] rounded" 
            onChange={(e) => setRepoInfo({...repoInfo, owner: e.target.value})} 
          />
          <input 
            placeholder="Название репозитория" 
            className="w-full bg-black border border-gray-800 p-2 text-[10px] rounded" 
            onChange={(e) => setRepoInfo({...repoInfo, repo: e.target.value})} 
          />
          <button 
            onClick={loadRepoTree} 
            className="w-full bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 text-[10px] py-2 rounded border border-blue-900/50 transition-all font-bold"
          >
            ПОДКЛЮЧИТЬ ХРОНИКИ
          </button>
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="h-3/5 border-b border-gray-800">
                <OracleChat onApplyCode={(code) => setCurrentCode(code)} />
            </div>
            <div className="h-2/5 overflow-hidden relative">
                <FileTree 
                    files={files} 
                    onFileClick={handleFileClick} 
                    onCreateFile={handleCreateFile} 
                />
            </div>
        </div>
      </section>

      <section className="flex-grow flex flex-col h-full">
        <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">{currentFilePath || "Файл не выбран"}</span>
          <button 
            onClick={handlePush}
            disabled={isPushing}
            className="bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 text-[10px] px-4 py-1 rounded border border-emerald-900/50 transition-all font-bold disabled:opacity-50"
          >
            {isPushing ? "МАТЕРИАЛИЗАЦИЯ..." : "МАТЕРИАЛИЗОВАТЬ (PUSH)"}
          </button>
        </div>
        <div className="flex-grow">
           <CodeAltar code={currentCode} onChange={(val) => setCurrentCode(val || "")} />
        </div>
      </section>
    </main>
  );
}
