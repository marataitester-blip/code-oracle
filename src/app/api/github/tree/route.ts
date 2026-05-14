import { NextResponse } from 'next/server';
import { fetchRepositoryTree } from '@/lib/github';

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
    return NextResponse.json(tree);
  } catch (error: any) {
    console.error('Error fetching repository tree:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch repository tree' }, { status: 500 });
  }
}
