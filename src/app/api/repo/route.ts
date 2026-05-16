import { NextResponse } from 'next/server';

// Принудительно отключаем кэширование, чтобы всегда видеть актуальные файлы
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const token = process.env.GITHUB_PAT;

  // Проверка наличия всех необходимых данных
  if (!owner || !repo || !token) {
    return NextResponse.json({ error: 'Missing parameters or GITHUB_PAT' }, { status: 400 });
  }

  try {
    // Запрашиваем всё дерево файлов репозитория рекурсивно через GitHub API
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Oracle-App'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `GitHub API error: ${res.status} ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    
    // Преобразуем данные в удобный для нашего интерфейса формат
    const tree = data.tree.map((item: any) => ({
      path: item.path,
      type: item.type === 'blob' ? 'blob' : 'tree'
    }));

    return NextResponse.json(tree);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
