import { NextResponse } from "next/server";

import { useEmbedImage } from "../embed";

export async function GET(
  request: Request,
  {
    params: { projectHandle, slug },
  }: { params: { projectHandle: string; slug: string } },
) {
  const image = await useEmbedImage(projectHandle, slug);

  if (!image) {
    return new NextResponse("", {
      status: 404,
    });
  }

  const response = new NextResponse(image.data);
  response.headers.set("Content-Type", image.mimeType);
  return response;
}
