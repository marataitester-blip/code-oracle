import { NextResponse } from 'next/server';

// Отключаем кэширование, чтобы всегда получать свежий код из репозитория
export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com/repos";

// GET: Функция для чтения содержимого файла из GitHub
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const token = process.env.GITHUB_PAT;

  // Проверяем, что все параметры на месте
  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ error: 'Missing data or token' }, { status: 400 });
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
    if (!res.ok) throw new Error(data.message || 'GitHub Error');

    // Декодируем содержимое из Base64 в обычный читаемый текст
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return NextResponse.json({ content, sha: data.sha });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Функция для записи (материализации) изменений обратно в GitHub
export async function POST(request: Request) {
  const { owner, repo, path, content } = await request.json();
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ error: 'Missing data or token' }, { status: 400 });
  }

  try {
    // Шаг 1: Узнаем текущий SHA файла (GitHub требует его для обновления)
    const getRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      }
    });
    const getData = await getRes.json();
    const sha = getData.sha;

    // Шаг 2: Отправляем обновленный код
    const putRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      },
      body: JSON.stringify({
        message: `Oracle Update: ${path}`,
        content: Buffer.from(content).toString('base64'), // Кодируем текст в Base64 для GitHub
        sha: sha // Передаем идентификатор версии
      })
    });

    if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || 'Failed to push changes');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}import { NextResponse } from 'next/server';

// Отключаем кэширование, чтобы всегда получать свежий код из репозитория
export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com/repos";

// GET: Функция для чтения содержимого файла из GitHub
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const token = process.env.GITHUB_PAT;

  // Проверяем, что все параметры на месте
  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ error: 'Missing data or token' }, { status: 400 });
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
    if (!res.ok) throw new Error(data.message || 'GitHub Error');

    // Декодируем содержимое из Base64 в обычный читаемый текст
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return NextResponse.json({ content, sha: data.sha });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Функция для записи (материализации) изменений обратно в GitHub
export async function POST(request: Request) {
  const { owner, repo, path, content } = await request.json();
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !path || !token) {
    return NextResponse.json({ error: 'Missing data or token' }, { status: 400 });
  }

  try {
    // Шаг 1: Узнаем текущий SHA файла (GitHub требует его для обновления)
    const getRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      }
    });
    const getData = await getRes.json();
    const sha = getData.sha;

    // Шаг 2: Отправляем обновленный код
    const putRes = await fetch(`${GITHUB_API}/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      },
      body: JSON.stringify({
        message: `Oracle Update: ${path}`,
        content: Buffer.from(content).toString('base64'), // Кодируем текст в Base64 для GitHub
        sha: sha // Передаем идентификатор версии
      })
    });

    if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || 'Failed to push changes');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
