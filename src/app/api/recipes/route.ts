import { NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes, ingredients } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dietId = searchParams.get('dietId');

  try {
    if (!dietId) return NextResponse.json({ error: 'dietId is required' }, { status: 400 });
    
    const results = await db.select({
      id: recipes.id,
      dietId: recipes.dietId,
      ingredientId: recipes.ingredientId,
      gramPerPatientPerDay: recipes.gramPerPatientPerDay,
      ingredientName: ingredients.name,
      ingredientType: ingredients.type,
      basePricePerKg: ingredients.basePricePerKg,
    })
    .from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .where(eq(recipes.dietId, parseInt(dietId)));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dietId, ingredientId, gramPerPatientPerDay } = await request.json();
    
    const [newRecipe] = await db.insert(recipes).values({
      dietId: parseInt(dietId),
      ingredientId: parseInt(ingredientId),
      gramPerPatientPerDay: parseFloat(gramPerPatientPerDay),
    }).returning();
    
    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
