import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Настраиваем подключение к OpenRouter
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'strict', // Обязательно для OpenRouter
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    // Добавлено "as any", чтобы TypeScript пропустил конфликт внутренних типов библиотек
    model: openrouter.chat('anthropic/claude-3.5-sonnet') as any,
    messages,
    system: "Ты — Senior Full-Stack разработчик. Твоя задача — анализировать, исправлять и писать код для Telegram Mini Apps и ботов. Выдавай код полностью, готовый к деплою. Общайся кратко, по делу.",
  });

  return result.toDataStreamResponse();
}
