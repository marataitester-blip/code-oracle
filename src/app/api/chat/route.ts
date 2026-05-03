import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Настраиваем подключение к OpenRouter
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'strict',
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Используем актуальную модель Gemini 1.5 Pro через OpenRouter
    // Она лучше справляется с большими объемами кода
    const modelId = 'google/gemini-pro-1.5'; 

    const result = await streamText({
      model: openrouter.chat(modelId) as any,
      messages,
      system: `Ты — Senior Full-Stack разработчик и системный архитектор. 
      Твоя специализация: Telegram Mini Apps, боты и Next.js.
      Правила:
      1. Всегда выдавай код файлов ЦЕЛИКОМ.
      2. Проводи глубокую аналитику на наличие багов.
      3. Будь краток в объяснениях, фокусируйся на реализации.`,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("ОШИБКА GEMINI-ORACLE:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
