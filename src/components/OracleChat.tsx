"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "ai/react";

export default function OracleChat() {
    // Подключаем хук от Vercel AI SDK для автоматического управления состоянием
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'system-greeting',
                role: "assistant",
                content: "Система активирована. Опиши задачу или укажи репозиторий для анализа."
            }
        ]
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Автоматическая прокрутка вниз при поступлении новых ответов
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="w-full h-full flex flex-col bg-gray-950 text-gray-200 shadow-[2px_0_15px_rgba(0,0,0,0.5)] z-10">
            <div className="h-12 flex items-center px-4 bg-gray-900 border-b border-gray-800 shadow-sm">
                <span className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
                    Интерфейс ИИ
                </span>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4 font-mono text-sm">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`p-3 rounded-md max-w-[90%] shadow-md ${
                            msg.role === 'user' 
                                ? 'bg-blue-900/40 text-blue-100 self-end ml-auto border border-blue-800/50' 
                                : 'bg-gray-800/80 text-gray-300 self-start border border-gray-700'
                        }`}
                    >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-900 border-t border-gray-800">
                <form 
                    onSubmit={handleSubmit}
                    className="flex space-x-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Опиши задачу..."
                        className="flex-grow bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600 font-mono"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-800 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2 rounded text-sm font-semibold transition-all disabled:hover:shadow-none"
                    >
                        {isLoading ? 'Думает...' : 'Отправить'}
                    </button>
                </form>
            </div>
        </div>
    );
}
