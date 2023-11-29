import { notFound } from "next/navigation";

import config from "@/common/config";
import { Post, getPost } from "@/common/job";
import Debug from "./Debug";
import getPostId, { Params, PostIdWithNormalizedFlags } from "./params";

export default async function Post({
  params,
  searchParams: { debug },
}: {
  params: Params;
  searchParams: { debug?: string };
}) {
  const isDebug = debug !== undefined;

  const id = getPostId(params);
  if (!id) return notFound();

  const post = await getPost(id);
  if (!post) return notFound();

  const imageUrl = getImageUrl(id);
  const redirect = `window.location = decodeURIComponent("${encodeURIComponent(
    post.meta.url,
  )}");`;
  return (
    <html lang="en">
      <head>
        {/* textual metadata: we leave out og:site_name since it's mostly redundant*/}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta.title} />
        <meta property="og:url" content={post.meta.url} />

        {/* screenshot */}
        <meta property="og:image" content={imageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={imageUrl} />
      </head>
      <body>
        {/* redirect to the actual chost; TODO: UA sniffing or something */}
        {!isDebug && <script dangerouslySetInnerHTML={{ __html: redirect }} />}
        {isDebug && <Debug id={id} post={post} imageUrl={imageUrl} />}
      </body>
    </html>
  );
}

function getImageUrl(id: PostIdWithNormalizedFlags): string {
  const hasFlags = id.flagsNormalized != "";

  return hasFlags
    ? `${config.baseUrl}/${id.flagsNormalized}/${id.projectHandle}/post/${id.slug}/image`
    : `${config.baseUrl}/${id.projectHandle}/post/${id.slug}/image`;
}
