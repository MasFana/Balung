import { NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { gramPerPatientPerDay } = await request.json();
    const [updated] = await db.update(recipes)
      .set({ gramPerPatientPerDay: parseFloat(gramPerPatientPerDay) })
      .where(eq(recipes.id, parseInt(resolvedParams.id)))
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await db.delete(recipes).where(eq(recipes.id, parseInt(resolvedParams.id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
