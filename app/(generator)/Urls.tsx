import { ChangeEvent, useState } from "react";

import styles from "./Urls.module.css";

type Embed = {
  prefix: string;
  flags: string;
  suffix: string;
};

export default function Urls({
  post,
  result,
  placeholderPost,
  closeOnCopy,
  onChange,
}: {
  post: string;
  result: { embed: Embed } | { error: string };
  placeholderPost: string;
  closeOnCopy?: boolean;
  onChange?: (post: string) => void;
}) {
  const [copyVisible, setCopyVisible] = useState(false);

  const copyEmbed = async () => {
    if ("error" in result) return;

    const { prefix, flags, suffix } = result.embed;
    const url = prefix + flags + suffix;

    await navigator.clipboard.writeText(url);

    setCopyVisible(true);
    setTimeout(() => {
      setCopyVisible(false);
      if (closeOnCopy) window.close();
    }, 500);
  };

  const input = (
    <label className={styles.post}>
      <span className={styles.visuallyHidden}>post url:</span>
      <input
        type="text"
        value={post}
        placeholder={placeholderPost}
        required
        onInput={(e: ChangeEvent<HTMLInputElement>) =>
          onChange && onChange(e.target.value)
        }
        title="enter post url"
      />
    </label>
  );

  const output =
    "embed" in result ? (
      <div
        onClick={copyEmbed}
        title="click to copy"
        className={`${styles.embed} ${post ? "" : styles.placeholder}`}
      >
        <span className={styles.visuallyHidden}>embed url: </span>
        {result.embed.prefix}
        <strong className={styles.embedFlags}>{result.embed.flags}</strong>
        {result.embed.suffix}
      </div>
    ) : (
      <div className={styles.error}>
        <span className={styles.visuallyHidden}>error: </span>
        {result.error}
      </div>
    );

  const copy = (
    <div className={`${styles.copy} ${copyVisible && styles.visible}`}>
      <CopyIcon />
      <span>copied!</span>
    </div>
  );

  return (
    <div className={styles.urls}>
      {input}
      {output}
      {copy}
    </div>
  );
}

function CopyIcon() {
  // heroicons document-duplicate
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  );
}
