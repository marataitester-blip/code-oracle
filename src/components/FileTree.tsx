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

  // ИНЖЕНЕРНЫЙ ФИКС: Оставляем ТОЛЬКО реальные файлы (blob), жестко отсекаем папки (tree)
  const justFiles = files.filter(f => f.type === 'blob');

  return (
    <div className="w-full bg-gray-900 p-4 overflow-y-auto border-r border-gray-800 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Радар Файлов</h2>
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
            placeholder="Путь (напр: app/page.tsx)"
            className="flex-grow p-2 bg-black text-emerald-400 border border-gray-700 rounded text-xs outline-none focus:border-emerald-500"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <button
            onClick={handleCreateFile}
            className="bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 font-bold py-1 px-3 rounded border border-emerald-800"
          >
            ✓
          </button>
        </div>
      )}

      {files.length > 0 ? (
        <ul className="space-y-2 overflow-x-hidden">
          {justFiles.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
            <li 
              key={file.path} 
              className="text-gray-400 hover:text-emerald-400 cursor-pointer text-xs font-mono break-all" 
              onClick={() => onFileClick(file.path)}
            >
              📄 {file.path}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-xs text-center mt-10">Хроники не подключены</p>
      )}
    </div>
  );
};

export default FileTree;
