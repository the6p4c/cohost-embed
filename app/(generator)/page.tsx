"use client";

import { useState } from "react";

import config from "@/common/config";
import Options, { Flag } from "./Flag";
import Urls from "./Urls";

import styles from "./page.module.css";

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
  const generateEmbed = (post: string, flags: { [id: string]: Flag }) => {
    if (!config.baseUrl) {
      throw "no base url (?)";
    }
    if (!URL.canParse(post)) {
      throw "invalid url";
    }

    const postUrl = new URL(post);
    if (postUrl.host != "cohost.org") {
      throw "not cohost";
    }

    const postUrlComponents = postUrl.pathname.slice(1).split("/");
    if (postUrlComponents.length != 3 || postUrlComponents[1] != "post") {
      throw "not a post";
    }

    const flagsString = Object.values(flags)
      .map(({ char }) => char)
      .sort() // canonicalize like the backend does
      .join("");

    // TODO: flag post URLs with comment hashes as unsupported
    const baseUrl = new URL(config.baseUrl);
    postUrl.protocol = baseUrl.protocol;
    postUrl.host = baseUrl.host; // includes port
    if (flagsString != "") {
      postUrl.pathname = `/${flagsString}${postUrl.pathname}`;
    }

    return postUrl.toString();
  };

  const [flags, setFlags] = useState<{ [id: string]: Flag }>({});

  const [post, setPost] = useState("");
  const [embed, setEmbed] = useState(generateEmbed(DEFAULT_POST, flags));
  const [error, setError] = useState<string | undefined>(undefined);

  const updateEmbed = (post: string, flags: { [id: string]: Flag }) => {
    try {
      setEmbed(generateEmbed(post || DEFAULT_POST, flags));
      setError(undefined);
    } catch (e: any) {
      setError(e);
    }
  };

  return (
    <div className={styles.container}>
      <Urls
        post={post}
        embed={embed}
        error={error}
        placeholderPost={DEFAULT_POST}
        onChange={(post) => {
          setPost(post);
          updateEmbed(post, flags);
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
                updateEmbed(post, newFlags);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
