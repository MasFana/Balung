import { NextResponse } from 'next/server';
import { db } from '@/db';
import { patientCensus, diets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    if (date) {
      // Get census for specific date
      const census = await db
        .select({
          id: patientCensus.id,
          dietId: patientCensus.dietId,
          patientCount: patientCensus.patientCount,
          dietName: diets.name,
        })
        .from(patientCensus)
        .innerJoin(diets, eq(patientCensus.dietId, diets.id))
        .where(eq(patientCensus.date, date));
      
      return NextResponse.json(census);
    } else {
      // Get all dates totals
      const allCensus = await db.select().from(patientCensus);
      const totalsByDate = allCensus.reduce((acc, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + curr.patientCount;
        return acc;
      }, {} as Record<string, number>);
      
      return NextResponse.json(totalsByDate);
    }
  } catch (error) {
    console.error('Error fetching census:', error);
    return NextResponse.json({ error: 'Failed to fetch census' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, counts } = body; // counts = { dietId: count }

    // Start a transaction or do sequential deletes/inserts
    await db.delete(patientCensus).where(eq(patientCensus.date, date));
    
    const insertData = Object.entries(counts).map(([dietId, count]) => ({
      date,
      dietId: parseInt(dietId),
      patientCount: Number(count),
    }));

    if (insertData.length > 0) {
      await db.insert(patientCensus).values(insertData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving census:', error);
    return NextResponse.json({ error: 'Failed to save census' }, { status: 500 });
  }
}