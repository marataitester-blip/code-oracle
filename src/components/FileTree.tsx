"use client";

import React, { useState } from "react";

interface FileTreeProps {
  files: any[];
  onFileClick: (path: string) => void;
  onCreateFile?: (path: string) => void; // Новая функция для создания файлов
}

export default function FileTree({ files, onFileClick, onCreateFile }: FileTreeProps) {
    const [newFileName, setNewFileName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Обработчик сохранения нового файла
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFileName.trim() && onCreateFile) {
            onCreateFile(newFileName.trim());
            setNewFileName("");
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-950 text-gray-300 text-[10px] font-mono overflow-y-auto border-t border-gray-800">
            {/* Шапка дерева файлов с кнопкой создания */}
            <div className="p-2 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0">
                <span className="uppercase tracking-widest text-gray-500 font-bold">Файлы проекта</span>
                {onCreateFile && (
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-900/20 rounded border border-emerald-900/50 transition-all font-bold"
                    >
                        + НОВЫЙ ФАЙЛ
                    </button>
                )}
            </div>
            
            {/* Форма ввода имени файла (появляется при нажатии на + НОВЫЙ ФАЙЛ) */}
            {isCreating && (
                <form onSubmit={handleCreate} className="p-2 border-b border-gray-800 bg-black flex gap-2">
                    <input 
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="название.tsx (или папка/файл.ts)"
                        className="flex-grow bg-gray-900 border border-gray-800 rounded px-2 py-1 focus:border-emerald-500 outline-none transition-all text-white"
                        autoFocus
                    />
                    <button type="submit" className="text-emerald-400 hover:text-emerald-300 px-2 bg-emerald-900/20 rounded font-bold">
                        ✓
                    </button>
                </form>
            )}

            {/* Список существующих файлов */}
            <div className="p-2 space-y-1">
                {files.length === 0 ? (
                    <div className="text-gray-600 italic px-2">Нет данных. Подключите репозиторий.</div>
                ) : (
                    files.map((file) => (
                        <div 
                            key={file.path} 
                            onClick={() => file.type === "blob" ? onFileClick(file.path) : null}
                            className={`cursor-pointer hover:bg-gray-800/50 py-1 px-2 rounded truncate transition-all ${
                                file.type === "tree" ? "text-blue-400 font-bold" : "text-gray-300"
                            }`}
                            style={{ paddingLeft: `${(file.path.split('/').length - 1) * 12 + 8}px` }}
                        >
                            {file.type === "tree" ? "📁 " : "📄 "}
                            {file.path.split('/').pop()}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
