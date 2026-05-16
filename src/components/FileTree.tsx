"use client";

import React, { useState } from 'react';

interface FileEntry {
  path: string;
  type: 'blob' | 'tree';
}

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

  // 1. Берем только файлы, жестко отсекаем багованные папки от GitHub
  const justFiles = files.filter(f => f.type === 'blob');

  // 2. Строим правильную иерархию папок самостоятельно
  const renderTree = (pathPrefix: string, fileList: FileEntry[]) => {
    const folders: { [key: string]: FileEntry[] } = {};
    const currentLevelFiles: FileEntry[] = [];

    fileList.forEach(file => {
      const relativePath = pathPrefix ? file.path.substring(pathPrefix.length + 1) : file.path;
      const parts = relativePath.split('/');

      if (parts.length > 1) {
        const folderName = parts[0];
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
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

export default FileTree;
