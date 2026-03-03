import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders, poLineItems, patientCensus, ingredients } from '@/db/schema';
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

    // Fetch all line items for the month with ingredient details
    const poItemsRaw = await db
      .select({
        date: purchaseOrders.targetDate,
        ingredientName: ingredients.name,
        qty: poLineItems.actualQty,
        pricePerKg: poLineItems.snapshotPricePerKg,
      })
      .from(poLineItems)
      .innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id))
      .innerJoin(ingredients, eq(poLineItems.ingredientId, ingredients.id))
      .where(like(purchaseOrders.targetDate, `${month}%`));

    // Calculate ingredientUsageChart, topByVolume, and topByCost
    const volumeMap: Record<string, number> = {};
    const costMap: Record<string, number> = {};
    const uniqueIngredientsSet = new Set<string>();

    for (const item of poItemsRaw) {
      const name = item.ingredientName;
      const qty = item.qty || 0;
      const cost = qty * (item.pricePerKg || 0);

      uniqueIngredientsSet.add(name);
      volumeMap[name] = (volumeMap[name] || 0) + qty;
      costMap[name] = (costMap[name] || 0) + cost;
    }

    const uniqueIngredients = Array.from(uniqueIngredientsSet);

    const topByVolume = Object.entries(volumeMap)
      .map(([name, totalKg]) => ({ name, totalKg }))
      .sort((a, b) => b.totalKg - a.totalKg);

    const topByCost = Object.entries(costMap)
      .map(([name, totalCost]) => ({ name, totalCost }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Merge by date
    // Find all days in the month
    const [year, m] = month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
    
    const chartData = [];
    const ingredientUsageChart = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${month}-${String(i).padStart(2, '0')}`;
      
      // Main chartData
      const poObj = poCosts.find(p => p.date === dayStr);
      const patObj = patientCounts.find(p => p.date === dayStr);
      chartData.push({
        date: dayStr,
        poCost: poObj ? poObj.cost : 0,
        patientCount: patObj ? patObj.count : 0,
      });

      // Ingredient usage chart
      const dayUsage: any = { date: dayStr };
      // Initialize all to 0
      for (const name of uniqueIngredients) {
        dayUsage[name] = 0;
      }

      // Aggregate for this day
      const itemsForDay = poItemsRaw.filter(item => item.date === dayStr);
      for (const item of itemsForDay) {
        dayUsage[item.ingredientName] += (item.qty || 0);
      }
      ingredientUsageChart.push(dayUsage);
    }

    return NextResponse.json({
      month,
      totalExpense,
      totalIngredientTypes,
      chartData,
      ingredientUsageChart,
      topByVolume,
      topByCost,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
