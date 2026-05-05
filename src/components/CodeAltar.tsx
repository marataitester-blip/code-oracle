"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface CodeAltarProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  isImage?: boolean;
  imageUrl?: string;
}

export default function CodeAltar({ code, onChange, language = "typescript", isImage, imageUrl }: CodeAltarProps) {
  
  if (isImage && imageUrl) {
    // Определяем тип медиа по началу Data URL
    const isVideo = imageUrl.startsWith('data:video');
    const isAudio = imageUrl.startsWith('data:audio');

    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-950 p-10 overflow-auto">
        <div className="relative group flex flex-col items-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 rounded-lg"></div>
          
          {isVideo ? (
            <video controls src={imageUrl} className="max-w-full max-h-[70vh] relative z-10 shadow-2xl border border-gray-800 rounded-lg outline-none" />
          ) : isAudio ? (
            <audio controls src={imageUrl} className="relative z-10 shadow-2xl outline-none mt-10" />
          ) : (
            <img src={imageUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain relative z-10 shadow-2xl border border-gray-800 rounded-lg" />
          )}

          <div className="mt-6 text-center text-[10px] text-gray-500 uppercase tracking-widest font-mono z-10">
            {isVideo ? "Видеоресурс проекта" : isAudio ? "Аудиоресурс проекта" : "Визуальный ресурс проекта"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      value={code}
      onChange={onChange}
      options={{
        fontSize: 12,
        fontFamily: "'Fira Code', monospace",
        minimap: { enabled: false },
        padding: { top: 20 },
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
      }}
    />
  );
}
