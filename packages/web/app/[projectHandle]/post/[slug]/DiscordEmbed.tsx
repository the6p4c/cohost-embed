import { Embed } from "./embed";

import styles from "./DiscordEmbed.module.css";

export default function DiscordEmbed({ embed }: { embed: Embed }) {
  return (
    <div className={styles.container}>
      <div className={styles.embed} style={{ borderColor: embed.themeColor }}>
        <div className={styles.siteName}>{embed.siteName}</div>
        <a className={styles.title}>{embed.title}</a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src={embed.imageUrl} alt="" />
      </div>
    </div>
  );
}
