"use client";

import React, { useState } from 'react';

interface FileEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface FileTreeProps {
  files: FileEntry[];
  onFileClick: (path: string) => void;
  onCreateFile: (fileName: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, onCreateFile }) => {
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileInput, setShowNewFileInput] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);

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
      // Защита от дублей путей при рекурсии
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
        <div>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-yellow-500 hover:text-yellow-400 font-bold text-xs px-2 mr-2 border border-yellow-800 rounded"
            title="Диагностика"
          >
            {showDebug ? "ЗАКРЫТЬ ЛОГ" : "ЛОГ"}
          </button>
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="text-emerald-400 hover:text-emerald-300 font-bold text-xl px-2"
            title="Создать файл"
          >
            +
          </button>
        </div>
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

      {showDebug && (
        <div className="mb-4 p-2 bg-gray-900 border border-yellow-700/50 rounded text-[10px] text-yellow-500 font-mono overflow-y-auto max-h-48">
          <p>Всего объектов от GitHub: {files.length}</p>
          <p>Из них файлов (blob): {justFiles.length}</p>
          <hr className="border-yellow-800 my-2" />
          {files.some(f => f.path.startsWith('app/')) ? (
            <p className="text-emerald-400 mb-2">✅ Папка app/ НАЙДЕНА в данных сервера!</p>
          ) : (
            <p className="text-red-400 mb-2">❌ ВНИМАНИЕ: Папки app/ НЕТ в данных от GitHub!</p>
          )}
          <p>Первые 15 путей из ответа:</p>
          <ul className="list-disc pl-4 mt-1">
            {files.slice(0, 15).map((f, i) => (
              <li key={i}>{f.type === 'tree' ? '📁' : '📄'} {f.path}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-grow overflow-y-auto pr-2">
        {files.length > 0 ? (
          renderTree('', justFiles)
        ) : (
          <p className="text-gray-600 text-xs text-center mt-10">Проект не подключен</p>
        )}
      </div>
    </div>
  );
};

export default FileTree;
