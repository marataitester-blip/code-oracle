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

    // Расширяем проверку: теперь система узнает картинки, видео и аудио
    const isMedia = /\.(png|jpe?g|gif|svg|ico|webp|mp4|webm|ogg|mp3|wav)$/i.test(path);

    if (isMedia) {
      const extension = path.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';

      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(extension || '')) {
          mimeType = `image/${extension}`;
      } else if (extension === 'svg') {
          mimeType = 'image/svg+xml';
      } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
          mimeType = `video/${extension}`;
      } else if (['mp3', 'wav'].includes(extension || '')) {
          mimeType = `audio/${extension}`;
      }

      const imageUrl = `data:${mimeType};base64,${data.content.replace(/\s/g, '')}`;
      // Возвращаем флаг isImage, чтобы не ломать логику главной страницы
      return NextResponse.json({ imageUrl, isImage: true });
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return NextResponse.json({ content, isImage: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
