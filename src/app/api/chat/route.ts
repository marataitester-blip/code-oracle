import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { prompt, fileContext } = await request.json();
  // Используем ключ, который ты добавил в Vercel
  const apiKey = process.env.OPENROUTER_API_KEY || ""; 

  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API Key is missing in Vercel' }, { status: 500 });
  }

  const contextMessage = fileContext 
    ? `\nТЕКУЩИЙ КОД ФАЙЛА (${fileContext.path}):\n${fileContext.content}\n` 
    : "";

  const systemInstruction = `Вы — Code Oracle. 
Помогайте инженеру в разработке "Живого Таро". 
Выдавайте код ТОЛЬКО ПОЛНЫМИ ФАЙЛАМИ. 
Никаких сокращений и комментариев вместо кода.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextMessage + prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Оракул задумался...";
    return NextResponse.json({ response: aiText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
