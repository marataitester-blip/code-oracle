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

  const renderTree = (pathPrefix: string, currentFiles: FileEntry[]) => {
    const folders: { [key: string]: FileEntry[] } = {};
    const fileList: FileEntry[] = [];

    currentFiles.forEach(file => {
      const relativePath = pathPrefix ? file.path.substring(pathPrefix.length + 1) : file.path;
      const parts = relativePath.split('/');

      if (parts.length > 1) {
        const folderName = parts[0];
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(file);
      } else {
        fileList.push(file);
      }
    });

    return (
      <ul className="ml-4">
        {Object.keys(folders).sort().map(folderName => (
          <li key={folderName} className="text-blue-400">
            <strong>📁 {folderName}</strong>
            {renderTree(`${pathPrefix}${pathPrefix ? '/' : ''}${folderName}`, folders[folderName])}
          </li>
        ))}
        {fileList.sort((a, b) => a.path.localeCompare(b.path)).map(file => (
          <li key={file.path} className="text-gray-300 hover:text-white cursor-pointer" onClick={() => onFileClick(file.path)}>
            📄 {file.path.split('/').pop()}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full bg-gray-800 p-4 overflow-y-auto border-r border-gray-700 h-full">
      <h2 className="text-xl font-bold mb-4 text-white">Древо файлов</h2>
      {files.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2"
          >
            + НОВЫЙ ФАЙЛ
          </button>
          {showNewFileInput && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Имя нового файла"
                className="flex-grow p-2 bg-gray-700 text-white border border-gray-600 rounded"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
              <button
                onClick={handleCreateFile}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Создать
              </button>
            </div>
          )}
        </div>
      )}
      {files.length > 0 ? renderTree('', files) : <p className="text-gray-400">Подключитесь к репозиторию для просмотра файлов.</p>}
    </div>
  );
};

export default FileTree;
