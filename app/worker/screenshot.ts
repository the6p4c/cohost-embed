import sharp from "sharp";

import config from "@/common/config";
import { Flag } from "@/common/job";

export async function processScreenshot(
  buffer: Buffer,
  flags: Flag[],
): Promise<Buffer> {
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) throw "no width and/or height";

  // limit aspect ratio
  const aspectRatio = flags.includes(Flag.Widescreen)
    ? config.screenshot.widescreen.aspectRatio
    : config.screenshot.widescreen.aspectRatio;
  const newHeight = Math.min(
    height,
    Math.trunc((width * aspectRatio.height) / aspectRatio.width),
  );

  return sharp(buffer)
    .extract({ left: 0, top: 0, width, height: newHeight })
    .toBuffer();
}
