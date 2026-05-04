
const match = text.match(codePattern);
        return match ? match[1].trim() : null;
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-950 text-gray-200">
            {/* Заголовок чата */}
            <div className="h-12 flex items-center px-4 bg-gray-900 border-b border-gray-800">
                <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">
                    Голос Оракула
                </span>
            </div>
            
            {/* История сообщений */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 font-mono text-sm">
                {messages.map((msg) => {
                    const codeBlock = extractCode(msg.content);
                    return (
                        <div 
                            key={msg.id} 
                            className={`p-3 rounded border transition-all ${
                                msg.role === 'user' 
                                    ? 'bg-purple-900/10 border-purple-800/30 ml-6' 
                                    : 'bg-gray-900 border-gray-800 mr-6'
                            }`}
                        >
                            <div className="whitespace-pre-wrap text-[12px] leading-relaxed">
                                {msg.content}
                            </div>
                            
                            {/* Кнопка применения кода */}
                            {codeBlock && msg.role === 'assistant' && (
                                <button 
                                    onClick={() => onApplyCode(codeBlock)}
                                    className="mt-4 w-full py-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-[10px] font-bold rounded uppercase border border-purple-700/50 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                >
                                    Применить код к редактору
                                </button>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Поле ввода */}
            <form 
                onSubmit={handleSubmit} 
                className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2"
            >
                <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Задай вопрос Оракулу..."
                    className="flex-grow bg-black border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()} 
                    className="bg-purple-800 px-4 py-2 rounded text-xs font-bold hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 transition-all active:scale-95"
                >
                    {isLoading ? "..." : "→"}
                </button>
            </form>
        </div>
    );
}
