import { redirect } from "next/navigation";

import config from "@/common/config";

export default function Home() {
  return redirect(config.homeRedirect);
}
