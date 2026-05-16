import { NextResponse } from 'next/server';
import { fetchRepositoryTree } from '@/lib/github';

// ИНЖЕНЕРНЫЙ ФИКС: Жестко отключаем кэширование на уровне сервера.
// Заставляем систему собирать данные в реальном времени при каждом клике.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner') as string;
  const repo = searchParams.get('repo') as string;

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Owner and repository are required' }, { status: 400 });
  }

  const token = process.env.GITHUB_PAT;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  try {
    const tree = await fetchRepositoryTree(token, owner, repo, "main");
    
    // Добавляем заголовки, чтобы даже браузер не смел кэшировать этот ответ
    return NextResponse.json(tree, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching repository tree:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch repository tree' }, { status: 500 });
  }
}
