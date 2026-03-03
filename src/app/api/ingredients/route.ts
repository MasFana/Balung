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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, basePricePerKg } = body;

    if (!name || !type || typeof basePricePerKg !== 'number') {
      return NextResponse.json({ error: 'Invalid ingredient data' }, { status: 400 });
    }

    const newIngredient = await db.insert(ingredients).values({
      name,
      type,
      basePricePerKg,
    }).returning();

    return NextResponse.json(newIngredient[0], { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 });
  }
}
