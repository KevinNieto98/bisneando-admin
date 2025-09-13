export async function getPerfilesActivosAction() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tbl_perfiles?select=*&is_active=eq.true&order=id_perfil.asc`

  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // o ANON_KEY
  if (!apiKey) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno')
    return []
  }

  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('Error al obtener perfiles activos:', res.status, await res.text())
    return []
  }

  return res.json()
}
