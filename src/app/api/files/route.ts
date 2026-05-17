import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com/repos";

// GET: Безопасное чтение содержимого файла из GitHub
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ 
      error: 'Отсутствуют обязательные параметры (owner, repo, path) или не настроен GITHUB_PAT в Vercel.' 
    }, { status: 400 });
  }

  try {
    const res = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      }
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ 
        error: data.message || `GitHub вернул статус ${res.status}` 
      }, { status: res.status });
    }

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return NextResponse.json({ content, sha: data.sha });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Запись (материализация) изменений в GitHub
export async function POST(request: Request) {
  const token = process.env.GITHUB_PAT;

  if (!token) {
    return NextResponse.json({ error: 'Критическая ошибка: токен GITHUB_PAT отсутствует в переменных окружения Vercel.' }, { status: 500 });
  }

  try {
    const { owner, repo, path, content } = await request.json();

    if (!owner || !repo || !path) {
      return NextResponse.json({ error: 'Переданы неполные данные для записи.' }, { status: 400 });
    }

    // Шаг 1: Получаем актуальный SHA файла
    const getRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      }
    });
    
    const getData = await getRes.json();
    const sha = getRes.ok ? getData.sha : undefined;

    // Шаг 2: Отправляем коммит в GitHub
    const putRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      },
      body: JSON.stringify({
        message: `Oracle Update: ${path}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha
      })
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return NextResponse.json({ error: errData.message || 'Не удалось отправить PUSH в репозиторий.' }, { status: putRes.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
