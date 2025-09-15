import { Sidebar, TopMenu } from "@/components";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/auth/login');
  }

  const first = data.user?.user_metadata?.first_name ?? '';
  const last  = data.user?.user_metadata?.last_name ?? '';
  const emailHandle = data.user?.email?.split('@')[0];

  const display_name =
    (first || last ? `${first} ${last}`.trim() : '') ||
    emailHandle ||
    "Usuario";

  const avatarUrl =
    data.user?.user_metadata?.avatar_url ??
    data.user?.user_metadata?.picture ?? // por si viene de OAuth
    null;

  return (
    <main className="min-h-screen">
      <TopMenu user={{ display_name }} />
      <Sidebar user={{ name: display_name, avatarUrl }} />
      <div>{children}</div>
    </main>
  );
}
