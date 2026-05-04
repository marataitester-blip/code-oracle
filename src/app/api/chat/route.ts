import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'strict',
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    /** * В 2026 году актуальные ID в OpenRouter:
     * 1. 'google/gemini-2.0-flash-001' - самая новая и стабильная
     * 2. 'google/gemini-pro-1.5' - если починили эндпоинт
     * 3. 'google/gemini-2.0-pro-exp-02-05' - для тяжелых задач
     */
    const modelId = 'google/gemini-2.0-flash-001'; 

    const result = await streamText({
      model: openrouter.chat(modelId) as any,
      messages,
      headers: {
        "HTTP-Referer": "https://code-oracle.vercel.app", // Обязательно для OpenRouter
        "X-Title": "Code Oracle",
      },
      system: `Ты — Senior Full-Stack разработчик. 
      Специализация: Telegram Mini Apps и Next.js.
      Всегда пиши код файлов ЦЕЛИКОМ. Будь краток.`,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    // Выводим в консоль Vercel более подробную ошибку
    console.error("ДЕТАЛИ ОШИБКИ:", error.responseBody || error.message);
    
    return new Response(JSON.stringify({ 
      error: "Ошибка модели", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
