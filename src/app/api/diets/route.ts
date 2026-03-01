import { NextResponse } from 'next/server';
import { db } from '@/db';
import { diets } from '@/db/schema';

export async function GET() {
  try {
    const allDiets = await db.select().from(diets);
    return NextResponse.json(allDiets);
  } catch (error) {
    console.error('Error fetching diets:', error);
    return NextResponse.json({ error: 'Failed to fetch diets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const [newDiet] = await db.insert(diets).values({ name }).returning();
    return NextResponse.json(newDiet, { status: 201 });
  } catch (error) {
    console.error('Error creating diet:', error);
    return NextResponse.json({ error: 'Failed to create diet' }, { status: 500 });
  }
}
