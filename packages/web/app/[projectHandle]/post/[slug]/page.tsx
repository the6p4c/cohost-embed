import { notFound } from "next/navigation";

import DiscordEmbed from "./DiscordEmbed";
import { useEmbed } from "./embed";

import styles from "./page.module.css";

export default async function Post({
  params: { projectHandle, slug },
  searchParams: { debug },
}: {
  params: { projectHandle: string; slug: string };
  searchParams: { debug?: string };
}) {
  const isDebug = debug !== undefined;

  const embed = await useEmbed(projectHandle, slug);
  if (!embed) return notFound();

  const metadata = (
    <>
      <meta property="og:site_name" content={embed.siteName} />
      <meta property="og:title" content={embed.title} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={embed.url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:image" content={embed.imageUrl} />
      <meta name="twitter:image" content={embed.imageUrl} />
    </>
  );

  const debugInfo = (
    <>
      <h1>request info</h1>
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

      <h1>example embeds</h1>
      <h2>discord</h2>
      <DiscordEmbed embed={embed} />
    </>
  );

  const redirect =
    'window.location = document.querySelector("meta[property=\\"og:url\\"]").getAttribute("content");';

  return (
    <html lang="en">
      <head>{metadata}</head>
      <body>
        {isDebug ? (
          debugInfo
        ) : (
          <script dangerouslySetInnerHTML={{ __html: redirect }} />
        )}
      </body>
    </html>
  );
}
