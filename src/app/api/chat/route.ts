import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Увеличиваем лимит времени выполнения до 60 секунд

export async function POST(request: Request) {
  const { prompt, fileContext } = await request.json();
  
  // Жестко привязываемся ТОЛЬКО к OpenRouter, обходя VPN-блокировки
  const apiKey = process.env.OPENROUTER_API_KEY || ""; 

  if (!apiKey) {
    return NextResponse.json({ error: 'Ключ OPENROUTER_API_KEY не найден в настройках Vercel.' }, { status: 500 });
  }

  const contextMessage = fileContext 
    ? `\nТЕКУЩИЙ КОД ФАЙЛА (${fileContext.path}):\n${fileContext.content}\n` 
    : "";

  const systemInstruction = `Вы — Code Oracle. Помогайте инженеру в разработке "Живого Таро". Выдавайте код ТОЛЬКО ПОЛНЫМИ ФАЙЛАМИ. Никаких сокращений и комментариев вместо кода.`;
  const fullPrompt = contextMessage + prompt;

  try {
    // Прямой запрос к OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://code-oracle.vercel.app', // Обязательно для OpenRouter
        'X-Title': 'Code Oracle'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', 
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: fullPrompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || data.message || JSON.stringify(data));
    }

    // Извлекаем ответ в формате OpenRouter
    const aiText = data.choices?.[0]?.message?.content || "Оракул молчит...";

    return NextResponse.json({ response: aiText });
  } catch (error: any) {
    console.error("OpenRouter API Error:", error);
    return NextResponse.json({ error: `Сбой OpenRouter: ${error.message}` }, { status: 500 });
  }
}
