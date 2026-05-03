"use client";

import React, { useState } from "react";

export default function OracleChat() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{role: string, content: string}[]>([{
        role: "system",
        content: "Я — Оракул. Готов погрузиться в теневые аспекты твоего кода и вывести их на свет сознания."
    }]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        // Перемещение мысли пользователя в общее поле
        setMessages(prev => [...prev, { role: "user", content: input }]);
        setInput("");
        
        // TODO: Здесь будет инициализирован канал Vercel AI SDK + OpenRouter
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-950 text-gray-200 shadow-[2px_0_15px_rgba(0,0,0,0.5)] z-10">
            <div className="h-12 flex items-center px-4 bg-gray-900 border-b border-purple-900/50 shadow-sm">
                <span className="text-sm font-semibold tracking-wider text-purple-400 uppercase">
                    Голос Оракула
                </span>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4 font-mono text-sm">
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 rounded-md max-w-[90%] shadow-md ${
                            msg.role === 'user' 
                                ? 'bg-purple-900/40 text-purple-100 self-end ml-auto border border-purple-800/50' 
                                : 'bg-gray-800/80 text-gray-300 self-start border border-gray-700'
                        }`}
                    >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-gray-900 border-t border-purple-900/50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Опиши желаемое изменение..."
                        className="flex-grow bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600 font-mono"
                    />
                    <button 
                        onClick={handleSend} 
                        className="bg-purple-800 hover:bg-purple-700 text-purple-100 px-5 py-2 rounded text-sm font-semibold transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    >
                        Вопросить
                    </button>
                </div>
            </div>
        </div>
    );
}
