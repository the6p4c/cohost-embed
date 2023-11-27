import { Locator, Page } from "playwright";

import config from "@/common/config";
import { Flag } from "@/common/job";

export async function preparePage(page: Page, flags: Flag[]) {
  // widescreen rendering: we don't need to set the default here as it's already set when the
  // browser is launched
  if (flags.includes(Flag.Widescreen)) {
    await page.setViewportSize(config.screenshot.widescreen.viewport);
  }

  // light mode/dark mode
  if (flags.includes(Flag.DarkMode)) {
    await page.emulateMedia({ colorScheme: "dark" });
  }

  // delete header bar to ensure it doesn't overlap with tall posts
  await page.locator("header.fixed").evaluate((el) => el.remove());
}

export async function preparePost(post: Locator, flags: Flag[]) {
  // useful post components
  const header = post.locator(".co-thread-header");
  const footer = post.locator(".co-thread-footer");

  // remove rounded corners from post: the page background shines through otherwise
  await post.evaluate((el) => (el.style.borderRadius = "0"));
  await header.evaluate((el) => (el.style.borderRadius = "0"));
  await footer.evaluate((el) => (el.style.borderRadius = "0"));

  // remove the meatball menu button
  // - we delete the path from inside the svg so as to retain the header height
  // - in a reply to an ask, the ask balloon is also a .co-action-button so we take the last button
  //   (which hopefully will be the meatball menu)
  await header
    .locator(".co-action-button path")
    .last()
    .evaluate((el) => el.remove());

  // remove the log in button
  await footer.locator(".co-action-button path").evaluate((el) => el.remove());

  // expand 18+ content
  const notBaby = post.locator(".co-filled-button", { hasText: "I am 18+" });
  if ((await notBaby.count()) == 1) {
    notBaby.click();

    // remove the "hide post" button
    await post
      .locator(".co-filled-button", { hasText: "hide post" })
      .evaluate((el) => el.remove());
    // remove the "18+" badge
    await post
      .locator(".co-info-box", { hasText: "18+" })
      .evaluate((el) => el.remove());
  }
}

export async function waitUntilReady(page: Page) {
  // TODO: does this actually help, or even work at all?
  await page.waitForLoadState("networkidle");
}
