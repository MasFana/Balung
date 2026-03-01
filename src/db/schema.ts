import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'WET' or 'DRY'
  basePricePerKg: real('base_price_per_kg').notNull(),
});

export const diets = sqliteTable('diets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 'Normal', 'High-Protein', 'Low-Sodium'
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dietId: integer('diet_id').references(() => diets.id, { onDelete: 'cascade' }).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id, { onDelete: 'cascade' }).notNull(),
  gramPerPatientPerDay: real('gram_per_patient_per_day').notNull(),
});

export const patientCensus = sqliteTable('patient_census', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  dietId: integer('diet_id').references(() => diets.id).notNull(),
  patientCount: integer('patient_count').notNull(),
});

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poDate: text('po_date').notNull(), // YYYY-MM-DD
  targetDate: text('target_date').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // 'DRAFT', 'LOCKED'
  totalCost: real('total_cost').notNull(),
});

export const poLineItems = sqliteTable('po_line_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poId: integer('po_id').references(() => purchaseOrders.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  theoreticalQty: real('theoretical_qty').notNull(),
  actualQty: real('actual_qty').notNull(),
  snapshotPricePerKg: real('snapshot_price_per_kg').notNull(),
});
