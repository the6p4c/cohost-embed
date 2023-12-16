import { NextResponse } from "next/server";

import { getPost } from "@/common/job";
import getPostId, { Params } from "../params";

export async function GET(_request: Request, { params }: { params: Params }) {
  const notFound = () =>
    new NextResponse("", {
      status: 404,
    });

  const id = getPostId(params);
  if (!id) return notFound();

  const post = await getPost(id);
  if (!post) return notFound();

  const response = new NextResponse(
    Buffer.from(post.screenshot.base64, "base64"),
  );
  response.headers.set("Content-Type", post.screenshot.mimeType);
  return response;
}
