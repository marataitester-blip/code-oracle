import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { owner, repo, path, content, message } = await req.json();

    if (!owner || !repo || !path || !content) {
      return NextResponse.json({ error: "Недостаточно данных для пуша" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

    // 1. Получаем SHA текущего файла (нужен для обновления)
    let sha;
    try {
      const { data }: any = await octokit.rest.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) {
      // Если файла нет, sha останется undefined (создание нового файла)
    }

    // 2. Отправляем изменения
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || "Оракул: автоматическое исправление кода",
      content: Buffer.from(content).toString("base64"),
      sha,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка при пуше в GitHub:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
