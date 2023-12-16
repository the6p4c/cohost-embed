import { Flag, PostId } from "@/common/job";

const FLAG_MAP: { [key: string]: Flag | "ignore" | undefined } = {
  w: Flag.Widescreen,
  l: Flag.LightMode,
  // dark mode was originally a flag, but now is the default. we don't want to break existing URLs,
  // so we need to ignore the flag
  d: "ignore",
};

export type Params = {
  projectHandle: string;
  slug: string;
  flags: string;
};

export type PostIdWithNormalizedFlags = PostId & { flagsNormalized: string };

export default function getPostId({
  projectHandle,
  slug,
  flags,
}: Params): PostIdWithNormalizedFlags | undefined {
  const parsedFlags = parseFlags(flags);
  if (!parsedFlags) return;

  return { projectHandle, slug, ...parsedFlags };
}

function parseFlags(flagsRaw: string):
  | {
      flagsNormalized: string;
      flags: Flag[];
    }
  | undefined {
  // dummy flag used to signal no flags: revert it to what we really want, which is an empty string.
  // also accept empty strings, just in case we pass a normalized string back in
  if (flagsRaw === "" || flagsRaw === "_") {
    return {
      flagsNormalized: "",
      flags: [],
    };
  }

  // remove duplicates and enforce a canonical order
  const chars = Array.from(new Set(flagsRaw)).sort();
  const flagsNormalized = chars.join("");

  const allDefined = <T>(list: (T | undefined)[]): list is T[] =>
    !list.some((v) => v === undefined);

  // return undefined if any of the flags are unknown to us (allow us to introduce new flags by
  // carving out the space now)
  const allFlags = chars.map((c) => FLAG_MAP[c]);
  if (!allDefined(allFlags)) return;

  // remove ignored flags
  const flags = allFlags.filter((flag): flag is Flag => flag != "ignore");

  return { flagsNormalized, flags };
}
