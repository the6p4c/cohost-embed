import { ReactNode } from "react";

import { Post, PostId } from "@/common/job";

import styles from "./Debug.module.css";

export default function Debug({
  id,
  post,
  imageUrl,
}: {
  id: PostId;
  post: Post;
  imageUrl: string;
}) {
  return (
    <>
      <strong>request</strong>
      <Table>
        <ListRow name="flags" items={id.flags} />
        <Row name="projectHandle">{id.projectHandle}</Row>
        <Row name="slug">{id.slug}</Row>
      </Table>

      <strong>post meta</strong>
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

      <strong>post screenshot</strong>
      <Table>
        <CodeRow name="base64">{post.screenshot.base64}</CodeRow>
        <Row name="mimeType">{post.screenshot.mimeType}</Row>
        <ImageRows name="imageUrl" src={imageUrl} />
      </Table>
    </>
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
