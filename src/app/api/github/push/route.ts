import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { owner, repo, path, content, message } = await req.json();
    if (!owner || !repo || !path || content === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const token = process.env.GITHUB_PAT;
    if (!token) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });
    }

    const octokit = new Octokit({ auth: token });

    let sha = undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner, repo, path,
      });
      sha = (existingFile as any).sha;
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || `Update ${path}`,
      content: Buffer.from(content).toString("base64"),
      sha,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Push error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
