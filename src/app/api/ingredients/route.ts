import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ingredients } from '@/db/schema';

export async function GET() {
  try {
    const allIngredients = await db.select().from(ingredients);
    return NextResponse.json(allIngredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 });
  }
}
