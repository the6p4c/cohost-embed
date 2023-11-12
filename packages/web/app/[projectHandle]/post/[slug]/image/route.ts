import { getPost } from "cohost-embed-common/job";
import { NextResponse } from "next/server";

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

  const response = new NextResponse(Buffer.from(post.image.base64, "base64"));
  response.headers.set("Content-Type", post.image.mimeType);
  return response;
}
