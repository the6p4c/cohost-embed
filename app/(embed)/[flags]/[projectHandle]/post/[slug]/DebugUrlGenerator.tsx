"use client";
import { FormEvent, useState } from "react";

import config from "@/common/config";

import styles from "./DebugUrlGenerator.module.css";

export default function DebugUrlGenerator({ flags }: { flags: string }) {
  type Links = { user: string; debug: string };
  const [link, setLink] = useState<Links | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLink(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const urlString = formData.get("url")?.toString();
    if (!urlString) return;

    let url;
    try {
      url = new URL(urlString);
    } catch (e) {
      setError(`${e}`);
      return;
    }

    if (url.host != "cohost.org") {
      setError("not a cohost url");
      return;
    }

    if (!config.baseUrl) {
      setError("no config.baseUrl (?)");
      return;
    }

    const baseUrl = new URL(config.baseUrl);

    url.protocol = baseUrl.protocol;
    url.host = baseUrl.host;
    url.port = baseUrl.port;
    if (flags) {
      url.pathname = `/${flags}${url.pathname}`;
    }

    const debugUrl = new URL(url);
    debugUrl.search = "?debug";

    setLink({ user: url.toString(), debug: debugUrl.toString() });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label>
          post url{" "}
          <input name="url" type="text" required className={styles.url} />
        </label>{" "}
        <button type="submit" className={styles.go}>
          go
        </button>
      </div>
      {link && (
        <>
          <div>
            <a href={link.user} className={styles.link}>
              {link.user}
            </a>
          </div>
          <div>
            <a href={link.debug} className={styles.link}>
              {link.debug}
            </a>
          </div>
        </>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
