import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await auth();
  const sp = await searchParams;
  const callbackUrl =
    typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";

  if (session?.user) redirect(callbackUrl);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold">ConvertFlow Admin</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to manage tools and content.
        </p>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
