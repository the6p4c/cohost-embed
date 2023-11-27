import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cohost-embed",
};

export default function Home() {
  return (
    <html lang="en">
      <body>
        <p>hey.</p>
        <p>
          not sure what you did there, but it didn&apos;t really work. you
          might&apos;ve mistyped the url or something.{" "}
          <em style={{ fontSize: "small", color: "gray" }}>(404 not found)</em>
        </p>
      </body>
    </html>
  );
}
