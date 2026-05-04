"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "ai/react";

interface OracleChatProps {
  onApplyCode: (code: string) => void;
}

export default function OracleChat({ onApplyCode }: OracleChatProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Автоматическая прокрутка чата вниз при поступлении новых сообщений
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Извлечение блока кода из ответа ИИ (ищет текст между тройными обратными кавычками)
    const extractCode = (text: string) => {
        const match = text.match(/
http://googleusercontent.com/immersive_entry_chip/0

Сделай Commit этого файла в GitHub. Vercel запустит пересборку, и на этот раз она должна пройти успешно, так как ключевое слово `export default` на месте, а синтаксис полностью корректен.
