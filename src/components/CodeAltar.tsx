"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface CodeAltarProps {
    code: string;
    language?: string;
    onChange?: (value: string | undefined) => void;
}

export default function CodeAltar({ code, language = "typescript", onChange }: CodeAltarProps) {
    return (
        <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
            <div className="h-12 flex items-center justify-between px-4 bg-[#252526] text-gray-400 text-sm border-b border-black">
                <span className="font-mono text-gray-300">Алтарь Материализации (Monaco Editor)</span>
                
                {/* Кнопка материализации появится здесь после генерации изменений */}
                <button className="hidden bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-semibold transition-all">
                    Материализовать (Push to GitHub)
                </button>
            </div>
            
            <div className="flex-grow">
                <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                        wordWrap: "on",
                        padding: { top: 16 },
                        smoothScrolling: true,
                        cursorBlinking: "smooth"
                    }}
                />
            </div>
        </div>
    );
}
