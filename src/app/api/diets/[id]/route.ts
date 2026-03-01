import { NextResponse } from 'next/server';
import { db } from '@/db';
import { diets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { name } = await request.json();
    const [updated] = await db.update(diets).set({ name }).where(eq(diets.id, parseInt(resolvedParams.id))).returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating diet:', error);
    return NextResponse.json({ error: 'Failed to update diet' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await db.delete(diets).where(eq(diets.id, parseInt(resolvedParams.id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diet:', error);
    return NextResponse.json({ error: 'Failed to delete diet' }, { status: 500 });
  }
}
