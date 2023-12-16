import { ChangeEvent } from "react";

import styles from "./Urls.module.css";

export default function Urls({
  post,
  embed,
  error,
  placeholderPost,
  onChange,
}: {
  post: string;
  embed: string;
  error?: string;
  placeholderPost: string;
  onChange?: (post: string) => void;
}) {
  return (
    <div className={styles.urls}>
      <label>
        <span className={styles.visuallyHidden}>post url:</span>
        <input
          type="text"
          value={post}
          placeholder={placeholderPost}
          required
          onInput={(e: ChangeEvent<HTMLInputElement>) =>
            onChange && onChange(e.target.value)
          }
          className={styles.post}
        />
      </label>
      {error ? (
        <div className={styles.error}>
          <span className={styles.visuallyHidden}>error: </span>
          {error}
        </div>
      ) : (
        <div className={`${styles.embed} ${post ? "" : styles.placeholder}`}>
          <span className={styles.visuallyHidden}>embed url: </span>
          {embed}
        </div>
      )}
    </div>
  );
}
