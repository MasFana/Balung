import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders, poLineItems, patientCensus } from '@/db/schema';
import { like, eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = searchParams.get('month') || currentMonth;

  try {
    // Total Expense
    const expenseResult = await db.select({ total: sql`sum(${purchaseOrders.totalCost})`.mapWith(Number) })
      .from(purchaseOrders)
      .where(like(purchaseOrders.targetDate, `${month}%`));
    const totalExpense = expenseResult[0]?.total || 0;

    // Total Ingredient Types Bought
    const ingredientResult = await db.select({ count: sql`count(distinct ${poLineItems.ingredientId})`.mapWith(Number) })
      .from(poLineItems)
      .innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id))
      .where(like(purchaseOrders.targetDate, `${month}%`));
    const totalIngredientTypes = ingredientResult[0]?.count || 0;

    // Daily PO Cost
    const poCosts = await db.select({
      date: purchaseOrders.targetDate,
      cost: sql`sum(${purchaseOrders.totalCost})`.mapWith(Number),
    })
    .from(purchaseOrders)
    .where(like(purchaseOrders.targetDate, `${month}%`))
    .groupBy(purchaseOrders.targetDate);

    // Daily Patient Count
    const patientCounts = await db.select({
      date: patientCensus.date,
      count: sql`sum(${patientCensus.patientCount})`.mapWith(Number),
    })
    .from(patientCensus)
    .where(like(patientCensus.date, `${month}%`))
    .groupBy(patientCensus.date);

    // Merge by date
    // Find all days in the month
    const [year, m] = month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
    
    const chartData = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${month}-${String(i).padStart(2, '0')}`;
      const poObj = poCosts.find(p => p.date === dayStr);
      const patObj = patientCounts.find(p => p.date === dayStr);
      chartData.push({
        date: dayStr,
        poCost: poObj ? poObj.cost : 0,
        patientCount: patObj ? patObj.count : 0,
      });
    }

    return NextResponse.json({
      month,
      totalExpense,
      totalIngredientTypes,
      chartData,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
