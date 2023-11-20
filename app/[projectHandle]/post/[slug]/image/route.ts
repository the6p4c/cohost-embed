import { NextResponse } from "next/server";

import { getPost } from "@/common/job";

export async function GET(
  _request: Request,
  {
    params: { projectHandle, slug },
  }: { params: { projectHandle: string; slug: string } },
) {
  const post = await getPost(projectHandle, slug);
  if (!post) {
    return new NextResponse("", {
      status: 404,
    });
  }

  const response = new NextResponse(
    Buffer.from(post.screenshot.base64, "base64"),
  );
  response.headers.set("Content-Type", post.screenshot.mimeType);
  return response;
}
