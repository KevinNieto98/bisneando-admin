import { Sidebar, TopMenu } from "@/components";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ShopLayout({ children }: {
  children: React.ReactNode;
}) {
  // const supabase = await createClient()

  // const { data, error } = await supabase.auth.getUser()
  // if (error || !data?.user) {
  //   redirect('/auth/login')
  // }

  return (
    <main className="min-h-screen">

      <TopMenu />
      <Sidebar />
      <div className="">
        {children}

      </div>


    </main>
  );
}