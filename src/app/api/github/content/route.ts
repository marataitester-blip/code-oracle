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

    const isMedia = /\.(png|jpe?g|gif|svg|ico|webp|mp4|webm|ogg|mp3|wav)$/i.test(path);

    if (isMedia) {
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: 
      // Если это медиафайл, мы не кодируем его, а берем прямую ссылку (download_url).
      // Это позволяет мгновенно проигрывать даже самые тяжелые видеофайлы.
      if (data.download_url) {
        return NextResponse.json({ imageUrl: data.download_url, isImage: true });
      }
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return NextResponse.json({ content, isImage: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
