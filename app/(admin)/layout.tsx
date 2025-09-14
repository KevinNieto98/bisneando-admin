import { Sidebar, TopMenu } from "@/components";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ShopLayout({ children }: {
  children: React.ReactNode;
}) {
   const supabase = await createClient()

   const { data, error } = await supabase.auth.getUser()
   if (error || !data?.user) {
     redirect('/auth/login')
   }



  const display_name =
    data.user?.user_metadata?.display_name ||
    data.user?.user_metadata?.full_name ||
    data.user?.email?.split('@')[0] ||
    "Usuario";


  return (
    <main className="min-h-screen">

        <TopMenu user={{ display_name }} />
      <Sidebar />
      <div className="">
        {children}

      </div>


    </main>
  );
}