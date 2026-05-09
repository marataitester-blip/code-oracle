import { Octokit } from "octokit";

/**
 * Получение рекурсивного дерева файлов репозитория
 * @param owner - владелец репозитория
 * @param repo - название репозитория
 * @returns список файлов и папок (tree)
 */
export async function getRepositoryTree(owner: string, repo: string) {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_PAT is not set in environment variables");
  }

  const octokit = new Octokit({ auth: token });

  // 1. Получаем информацию о репозитории, чтобы узнать ветку по умолчанию
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  // 2. Получаем SHA последнего коммита ветки по умолчанию
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const commitSha = refData.object.sha;

  // 3. Получаем дерево коммита
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });
  const treeSha = commitData.tree.sha;

  // 4. Рекурсивно получаем дерево файлов
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  return treeData.tree;
}
