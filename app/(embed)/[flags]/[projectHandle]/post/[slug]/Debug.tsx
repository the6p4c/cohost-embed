import { ReactNode } from "react";

import { Post } from "@/common/job";
import { PostIdWithNormalizedFlags } from "./params";

import styles from "./Debug.module.css";

export default function Debug({
  id,
  post,
  imageUrl,
}: {
  id: PostIdWithNormalizedFlags;
  post: Post;
  imageUrl: string;
}) {
  return (
    <main className={styles.main}>
      <section>
        <h1>request</h1>
        <Table>
          <ListRow name="flags" items={id.flags} />
          <Row name="projectHandle">{id.projectHandle}</Row>
          <Row name="slug">{id.slug}</Row>
        </Table>
      </section>

      <section className={styles.sideBySide}>
        <section>
          <h1>post meta</h1>
          <Table>
            <Row name="themeColor">{post.meta.themeColor}</Row>
            <Row name="siteName">{post.meta.siteName}</Row>
            <Row name="title">{post.meta.title}</Row>
            <Row name="description">{post.meta.description}</Row>
            <LinkRow name="authorUrl" href={post.meta.authorUrl} />
            <LinkRow name="url" href={post.meta.url} />
            <ListRow name="tags" items={post.meta.tags} />
            <ImageRows name="imageUrl" src={post.meta.imageUrl} />
          </Table>
        </section>

        <section>
          <h1>post screenshot</h1>
          <Table>
            <ImageRows name="imageUrl" src={imageUrl} />
            <CodeRow name="base64">{post.screenshot.base64}</CodeRow>
            <Row name="mimeType">{post.screenshot.mimeType}</Row>
          </Table>
        </section>
      </section>
    </main>
  );
}

function Table({ children }: { children: ReactNode }) {
  return (
    <table className={styles.table}>
      <tbody>{children}</tbody>
    </table>
  );
}

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <tr>
      <th scope="row">{name}</th>
      <td>{children}</td>
    </tr>
  );
}

function LinkRow({ name, href }: { name: string; href: string }) {
  return (
    <Row name={name}>
      <a target="_blank" href={href}>
        {href}
      </a>
    </Row>
  );
}

function ListRow({ name, items }: { name: string; items: string[] }) {
  const list = (
    <div className={styles.list}>
      {items.map((item) => (
        <span key={item} className={styles.listItem}>
          {item}
        </span>
      ))}
    </div>
  );

  return <Row name={name}>{items.length != 0 ? list : "[empty]"}</Row>;
}

function ImageRows({ name, src }: { name: string; src: string }) {
  return (
    <>
      <LinkRow name={name} href={src} />
      <Row name={`[${name}]`}>
        <a target="_blank" href={src}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" />
        </a>
      </Row>
    </>
  );
}

function CodeRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Row name={name}>
      <code>{children}</code>
    </Row>
  );
}
