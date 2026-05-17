import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com/repos";

// GET: Безопасное чтение содержимого файла (без кэша)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ 
      error: 'Отсутствуют параметры или токен GITHUB_PAT.' 
    }, { status: 400 });
  }

  try {
    const res = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}?ref=main`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      },
      cache: 'no-store' // Жесткий запрет кэширования
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.message }, { status: res.status });
    }

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return NextResponse.json({ content, sha: data.sha });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Запись изменений строго в ветку main
export async function POST(request: Request) {
  const token = process.env.GITHUB_PAT;

  if (!token) {
    return NextResponse.json({ error: 'Токен GITHUB_PAT отсутствует.' }, { status: 500 });
  }

  try {
    const { owner, repo, path, content } = await request.json();

    if (!owner || !repo || !path) {
      return NextResponse.json({ error: 'Переданы неполные данные.' }, { status: 400 });
    }

    // 1. Получаем актуальный SHA (строго из main, без кэша)
    const getRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}?ref=main`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      },
      cache: 'no-store'
    });
    
    const getData = await getRes.json();
    const sha = getRes.ok ? getData.sha : undefined;

    // 2. Отправляем коммит (строго в main)
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
        sha: sha,
        branch: 'main' // Жесткая привязка к ветке Vercel
      })
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return NextResponse.json({ error: errData.message || 'Сбой PUSH.' }, { status: putRes.status });
    }

    const putData = await putRes.json();
    
    // Возвращаем успех и точную ссылку на коммит для нашего журнала
    return NextResponse.json({ 
      success: true, 
      commit_url: putData.commit?.html_url 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
