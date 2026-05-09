import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

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

    // Используем стабильную модель
    const modelId = 'google/gemini-1.5-pro';

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
    // Попытка извлечь тело ответа от OpenRouter
    let details = error.message;
    if (error.response?.body) {
      try {
        const bodyText = await error.response.text();
        details = bodyText;
        console.error("Тело ответа OpenRouter:", bodyText);
      } catch (e) {}
    }
    return new Response(JSON.stringify({ 
      error: "Ошибка связи с Оракулом", 
      details 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
