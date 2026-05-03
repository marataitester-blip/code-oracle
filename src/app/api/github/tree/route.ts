import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Нужны владелец и название репозитория" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

  try {
    // 1. Получаем информацию о ветке по умолчанию (обычно main или master)
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // 2. Получаем дерево файлов (рекурсивно)
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "true",
    });

    return NextResponse.json(treeData.tree);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
