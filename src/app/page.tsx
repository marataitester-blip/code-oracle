"use client";

import React, { useState } from "react";
import CodeAltar from "../components/CodeAltar";
import OracleChat from "../components/OracleChat";
import FileTree from "../components/FileTree";

export default function CodeOracle() {
  const [repoInfo, setRepoInfo] = useState({ owner: "", repo: "" });
  const [files, setFiles] = useState<any[]>([]);
  const [currentCode, setCurrentCode] = useState("// Выбери файл для редактирования");

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

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black text-gray-100">
      {/* Левая панель: Чат и Файлы */}
      <section className="w-1/3 min-w-[350px] max-w-[450px] flex flex-col border-r border-gray-800">
        <div className="p-4 bg-gray-900 border-b border-gray-800 space-y-2">
          <input 
            placeholder="Владелец (GitHub ID)"
            className="w-full bg-black border border-gray-700 p-2 text-xs rounded text-white"
            onChange={(e) => setRepoInfo({...repoInfo, owner: e.target.value})}
          />
          <input 
            placeholder="Название репозитория"
            className="w-full bg-black border border-gray-700 p-2 text-xs rounded text-white"
            onChange={(e) => setRepoInfo({...repoInfo, repo: e.target.value})}
          />
          <button 
            onClick={loadRepoTree}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold"
          >
            Подключить репозиторий
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden flex flex-col">
            <div className="h-1/2 border-b border-gray-800">
                <OracleChat />
            </div>
            <div className="h-1/2">
                <FileTree files={files} onFileClick={(path) => console.log("Открыть файл:", path)} />
            </div>
        </div>
      </section>

      {/* Правая панель: Редактор */}
      <section className="flex-grow h-full">
        <CodeAltar code={currentCode} onChange={(val) => setCurrentCode(val || "")} />
      </section>
    </main>
  );
}
