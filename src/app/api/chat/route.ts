import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Инициализация клиента OpenRouter с использованием DeepSeek
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

    const modelId = 'deepseek/deepseek-v3.2-speciale';
    const result = await streamText({
      model: openrouter(modelId) as any,
      messages,
      system: `Ты — Senior Full-Stack разработчик. 
      Специализация: Telegram Mini Apps и Next.js.
      Всегда пиши код файлов ЦЕЛИКОМ. Будь краток.`,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("ДЕТАЛИ ОШИБКИ:", error);
    return new Response(JSON.stringify({ 
      error: "Ошибка связи с Оракулом", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
