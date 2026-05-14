import { Octokit } from "octokit";

export async function fetchRepositoryTree(token: string, owner: string, repo: string, branch: string = "main") {
  const octokit = new Octokit({ auth: token });

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });
  const treeSha = commitData.tree.sha;

  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  return treeData.tree;
}

export const getRepositoryTree = fetchRepositoryTree;
