import { getCategoriasActivasAction } from '@/app/(admin)/categorias/actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categorias = await getCategoriasActivasAction()
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error en API /categorias/activas:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías activas' },
      { status: 500 }
    )
  }
}