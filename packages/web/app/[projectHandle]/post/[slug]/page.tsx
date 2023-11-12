import config from "cohost-embed-common/config";
import { getPost } from "cohost-embed-common/job";
import { notFound } from "next/navigation";

import styles from "./page.module.css";

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
        <meta property="og:site_name" content={post.siteName} />
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={post.url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:image" content={imageUrl} />
        <meta name="twitter:image" content={imageUrl} />
      </head>
      <body>
        {isDebug && (
          <>
            <strong>request</strong>
            <table className={styles.debugTable}>
              <tbody>
                <tr>
                  <th scope="row">projectHandle</th>
                  <td>{projectHandle}</td>
                </tr>
                <tr>
                  <th scope="row">slug</th>
                  <td>{slug}</td>
                </tr>
              </tbody>
            </table>

            <strong>post</strong>
            <table className={styles.debugTable}>
              <tbody>
                <tr>
                  <th scope="row">themeColor</th>
                  <td>{post.themeColor}</td>
                </tr>
                <tr>
                  <th scope="row">siteName</th>
                  <td>{post.siteName}</td>
                </tr>
                <tr>
                  <th scope="row">title</th>
                  <td>{post.title}</td>
                </tr>
                <tr>
                  <th scope="row">url</th>
                  <td>
                    <a href={post.url}>{post.url}</a>
                  </td>
                </tr>
                <tr>
                  <th scope="row">image</th>
                  <td>
                    <img src={imageUrl} />
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </body>
    </html>
  );
}
