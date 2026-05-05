"use client";

import React, { useState } from "react";
import CodeAltar from "../components/CodeAltar";
import OracleChat from "../components/OracleChat";
import FileTree from "../components/FileTree";

export default function CodeOracle() {
  const [repoInfo, setRepoInfo] = useState({ owner: "", repo: "" });
  const [files, setFiles] = useState<any[]>([]);
  const [currentCode, setCurrentCode] = useState("// Пространство для алхимии кода.");
  const [currentFilePath, setCurrentFilePath] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  
  // Состояния для изображений
  const [isImage, setIsImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const loadRepoTree = async () => {
    if (!repoInfo.owner || !repoInfo.repo) return;
    try {
        const res = await fetch(`/api/github/tree?owner=${repoInfo.owner}&repo=${repoInfo.repo}`);
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
    } catch (e) { console.error("Ошибка загрузки дерева"); }
  };

  const handleFileClick = async (path: string) => {
    setCurrentFilePath(path);
    setIsImage(false); // Сбрасываем режим картинки перед загрузкой
    const res = await fetch(`/api/github/content?owner=${repoInfo.owner}&repo=${repoInfo.repo}&path=${path}`);
    const data = await res.json();
    
    if (data.isImage) {
        setIsImage(true);
        setImageUrl(data.imageUrl);
    } else if (data.content) {
        setCurrentCode(data.content);
    }
  };

  const handleCreateFile = (path: string) => {
    setCurrentFilePath(path);
    setIsImage(false);
    setCurrentCode(`// Новый файл: ${path}\n// Опиши задачу Оракулу...`);
  };

  const handlePush = async () => {
    if (!currentFilePath || isImage) return alert("Нечего материализовать");
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
      if (res.ok) { alert("Успешно!"); loadRepoTree(); }
    } finally { setIsPushing(false); }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black text-gray-100 font-mono">
      <section className="w-1/3 min-w-[350px] flex flex-col border-r border-gray-800">
        <div className="p-4 bg-gray-900 border-b border-gray-800 space-y-2">
          <input placeholder="Владелец" className="w-full bg-black border border-gray-800 p-2 text-[10px] rounded" onChange={(e) => setRepoInfo({...repoInfo, owner: e.target.value})} />
          <input placeholder="Репозиторий" className="w-full bg-black border border-gray-800 p-2 text-[10px] rounded" onChange={(e) => setRepoInfo({...repoInfo, repo: e.target.value})} />
          <button onClick={loadRepoTree} className="w-full bg-blue-900/30 text-blue-400 text-[10px] py-2 rounded border border-blue-900/50 font-bold">ПОДКЛЮЧИТЬ</button>
        </div>
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="h-3/5 border-b border-gray-800"><OracleChat onApplyCode={(code) => setCurrentCode(code)} /></div>
            <div className="h-2/5 overflow-hidden"><FileTree files={files} onFileClick={handleFileClick} onCreateFile={handleCreateFile} /></div>
        </div>
      </section>
      <section className="flex-grow flex flex-col h-full relative">
        <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
          <span className="text-[10px] text-gray-500 uppercase">{currentFilePath || "Выбери файл"}</span>
          {!isImage && (
            <button onClick={handlePush} disabled={isPushing} className="bg-emerald-900/30 text-emerald-400 text-[10px] px-4 py-1 rounded border border-emerald-900/50 font-bold">
                {isPushing ? "ПРОЦЕСС..." : "МАТЕРИАЛИЗОВАТЬ"}
            </button>
          )}
        </div>
        <div className="flex-grow">
           <CodeAltar 
              code={currentCode} 
              onChange={(val) => setCurrentCode(val || "")} 
              isImage={isImage} 
              imageUrl={imageUrl} 
           />
        </div>
      </section>
    </main>
  );
}
