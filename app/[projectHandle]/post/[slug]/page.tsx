import { notFound } from "next/navigation";

import config from "@/common/config";
import { Post, getPost } from "@/common/job";
import DebugTable from "./DebugTable";

export default async function Post({
  params: { projectHandle, slug },
  searchParams: { debug },
}: {
  params: { projectHandle: string; slug: string };
  searchParams: { debug?: string };
}) {
  const isDebug = debug !== undefined;

  const post = await getPost(projectHandle, slug);
  if (!post) return notFound();

  const imageUrl = `${config.baseUrl}/${projectHandle}/post/${slug}/image`;

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
        {isDebug && (
          <DebugTable
            projectHandle={projectHandle}
            slug={slug}
            post={post}
            imageUrl={imageUrl}
          />
        )}
      </body>
    </html>
  );
}
