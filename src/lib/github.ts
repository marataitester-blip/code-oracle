import { Octokit } from "octokit";

/**
 * Чтение Хроник Акаши: получение полного дерева директорий репозитория.
 * Позволяет Оракулу окинуть взглядом структуру проекта, прежде чем погружаться в конкретные файлы.
 */
export async function fetchRepositoryTree(token: string, owner: string, repo: string, branch: string = "main") {
    // Инициация связи через Personal Access Token
    const octokit = new Octokit({ auth: token });

    try {
        // Шаг 1: Находим текущее состояние (голову) ветки
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        });
        const commitSha = refData.object.sha;

        // Шаг 2: Погружаемся в структуру коммита
        const { data: commitData } = await octokit.rest.git.getCommit({
            owner,
            repo,
            commit_sha: commitSha,
        });
        const treeSha = commitData.tree.sha;

        // Шаг 3: Рекурсивно извлекаем всё Древо (файлы и папки)
        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: treeSha,
            recursive: "true", // Глубокое сканирование всех уровней
        });

        // Возвращаем чистую структуру для анализа Оракулом
        return treeData.tree;
    } catch (error) {
        console.error("Теневое искажение при попытке прочитать Хроники GitHub:", error);
        throw error;
    }
}
