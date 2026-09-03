"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

export function PageviewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track({ type: "PAGEVIEW", path: pathname });
  }, [pathname]);
  return null;
}
