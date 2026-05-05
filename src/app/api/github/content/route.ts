import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

  try {
    const { data }: any = await octokit.rest.repos.getContent({ owner, repo, path });

    // Проверяем расширение файла
    const isImage = /\.(png|jpe?g|gif|svg|ico|webp)$/i.test(path);

    if (isImage) {
      // Для изображений возвращаем готовую строку для <img> (Data URL)
      // GitHub присылает контент в base64, нам просто нужно добавить заголовок
      const extension = path.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
      const imageUrl = `data:${mimeType};base64,${data.content.replace(/\s/g, '')}`;
      return NextResponse.json({ imageUrl, isImage: true });
    }

    // Для обычного кода декодируем base64 в текст
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return NextResponse.json({ content, isImage: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
