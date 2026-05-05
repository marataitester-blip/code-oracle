import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// 1. Правильная настройка провайдера: заголовки (паспортные данные) указываются именно здесь
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://code-oracle.vercel.app",
    "X-Title": "Code Oracle",
  }
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 2. Используем стабильный идентификатор модели
    const modelId = 'google/gemini-2.0-flash'; 

    const result = await streamText({
      // Используем as any, чтобы обойти строгую проверку типов TypeScript
      model: openrouter(modelId) as any,
      messages,
      system: `Ты — Senior Full-Stack разработчик. 
      Специализация: Telegram Mini Apps и Next.js.
      Всегда пиши код файлов ЦЕЛИКОМ. Будь краток.`,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    // Выводим в консоль Vercel подробную ошибку
    console.error("ДЕТАЛИ ОШИБКИ:", error.message || error);
    
    return new Response(JSON.stringify({ 
      error: "Ошибка связи с Оракулом", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
