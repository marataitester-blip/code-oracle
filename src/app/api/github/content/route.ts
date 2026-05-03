import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: "Недостаточно данных (owner, repo, path)" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

  try {
    // Запрашиваем содержимое файла
    const { data }: any = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    // GitHub возвращает контент в кодировке base64, декодируем его в обычный текст
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Ошибка при чтении файла:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
