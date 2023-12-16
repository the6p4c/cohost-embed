"use client";
import { useState } from "react";

import config from "@/common/config";
import Options, { Flag } from "./Flag";
import Urls from "./Urls";

import styles from "./page.module.css";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

const FLAGS = {
  colorScheme: [
    { char: "", name: "dark mode" },
    { char: "l", name: "light mode" },
  ],
  layout: [
    { char: "", name: "mobile layout" },
    { char: "w", name: "widescreen layout" },
  ],
};

const DEFAULT_POST = "https://cohost.org/jkap/post/16-i-hit-the-juckport-1";

export default function Home() {
  const [flags, setFlags] = useState<{ [id: string]: Flag }>({});

  const providedPost = parseSearchParams(useSearchParams());
  const closeOnCopy = !!providedPost;

  const [post, setPost] = useState(providedPost || "");
  const [result, setResult] = useState(generateEmbed(providedPost, flags));

  return (
    <div className={styles.container}>
      <Urls
        post={post}
        result={result}
        placeholderPost={DEFAULT_POST}
        closeOnCopy={closeOnCopy}
        onChange={(post) => {
          setPost(post);
          setResult(generateEmbed(post, flags));
        }}
      />

      <h2>options</h2>
      <ul className={styles.flags}>
        {Object.entries(FLAGS).map(([id, optionFlags]) => (
          <li key={id}>
            <Options
              flags={optionFlags}
              selected={flags[id] || optionFlags[0]}
              onChange={(flag) => {
                const newFlags = { ...flags, [id]: flag };
                setFlags(newFlags);
                setResult(generateEmbed(post, newFlags));
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseSearchParams(searchParams: ReadonlyURLSearchParams) {
  const entries = Array.from(searchParams.entries());
  if (entries.length == 1 && entries[0][1] == "") {
    return entries[0][0];
  } else {
    return undefined;
  }
}

function generateEmbed(
  post: string | undefined,
  flags: { [id: string]: Flag },
) {
  post = post || DEFAULT_POST;

  if (!config.baseUrl) {
    return { error: "no base url (?)" };
  }
  if (!URL.canParse(post)) {
    return { error: "invalid url" };
  }

  const postUrl = new URL(post);
  if (postUrl.host != "cohost.org") {
    return { error: "not cohost" };
  }

  const postUrlComponents = postUrl.pathname.slice(1).split("/");
  if (postUrlComponents.length != 3 || postUrlComponents[1] != "post") {
    return { error: "not a post" };
  }

  const flagsString = Object.values(flags)
    .map(({ char }) => char)
    .sort() // canonicalize like the backend does
    .join("");

  return {
    embed: {
      prefix: flagsString != "" ? `${config.baseUrl}/` : config.baseUrl,
      flags: flagsString,
      suffix: postUrl.pathname,
    },
  };
}
