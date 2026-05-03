"use client";

import React from "react";

interface FileTreeProps {
  files: any[];
  onFileClick: (path: string) => void;
}

export default function FileTree({ files, onFileClick }: FileTreeProps) {
  if (!files || files.length === 0) return (
    <div className="p-4 text-gray-500 text-xs font-mono">Репозиторий не выбран или пуст</div>
  );

  return (
    <div className="flex flex-col overflow-y-auto h-full bg-gray-950 border-t border-gray-800">
      <div className="p-2 bg-gray-900 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        Структура проекта
      </div>
      <div className="p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.path}
            onClick={() => file.type === "blob" && onFileClick(file.path)}
            className={`cursor-pointer truncate py-1 px-2 text-xs font-mono rounded transition-colors ${
              file.type === "tree" 
                ? "text-blue-400 font-semibold" 
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            style={{ paddingLeft: `${(file.path.split("/").length - 1) * 12 + 8}px` }}
          >
            {file.type === "tree" ? "📁 " : "📄 "}
            {file.path.split("/").pop()}
          </div>
        ))}
      </div>
    </div>
  );
}
