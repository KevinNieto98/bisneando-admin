'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server';
 
export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}


export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    redirect("/error")
  }

  // refresca el layout/base de la app
  revalidatePath("/", "layout")

  // manda al login o a la home
  redirect("/auth/login")
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/reset`; // debe ser ABSOLUTO y estar permitido en Supabase

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("Error enviando link de recuperación", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect(`/auth/forgot-password/sent?email=${encodeURIComponent(email ?? "")}`);
}