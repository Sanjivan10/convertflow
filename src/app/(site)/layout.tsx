import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageviewTracker } from "@/components/pageview-tracker";
import { Toaster } from "@/components/ui/toast";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <PageviewTracker />
      <Toaster />
    </>
  );
}
