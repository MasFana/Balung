# Technical Implementation Plan: NCL V3.0

This document structures the execution plan for the **Next.js Developer** and **Fullstack Developer** based on the `UX_UI_GUIDELINES.md`. It translates the UX requirements into actionable engineering tasks.

---

## 1. Master Data CRUD: Menu Templates (Diets & Recipes mapping)

The UX dictates a split-screen (desktop) or drill-down (mobile) Master Data UI where users select a "Diet" and manage its "Recipe Builder" (ingredients + grammage).

### 1.1 Database Schema Updates (`src/db/schema.ts`)
The current schema already supports the core relationships via `diets` and `recipes` (acting as the many-to-many junction with grammage). However, minor updates are recommended for easier CRUD:
- **Cascading Deletes**: Ensure `recipes` (which maps `dietId` and `ingredientId`) has cascading deletes so removing a diet doesn't leave orphaned recipes.
- **Diet Metadata**: Add an optional `description` or `isActive` flag to the `diets` table if extended tracking is needed.
- *Developer Action*: Update the `references` in `recipes` to include `.onDelete('cascade')`.

### 1.2 Required API Routes
- **`GET /api/diets`**: Fetch all diets for the left pane list.
- **`POST /api/diets`**: Create a new diet.
- **`PUT /api/diets/[id]` & `DELETE /api/diets/[id]`**: Manage diet names.
- **`GET /api/recipes?dietId={id}`**: Fetch the recipe mapping (ingredients and grammage) for the selected diet. Needs to `leftJoin` the `ingredients` table to return the ingredient `name` and `type`.
- **`POST /api/recipes`**: Add a new ingredient to a diet (creates a record in `recipes` with `dietId`, `ingredientId`, `gramPerPatientPerDay`).
- **`PUT /api/recipes/[id]`**: Inline update of `gramPerPatientPerDay` for a specific recipe row.
- **`DELETE /api/recipes/[id]`**: Remove an ingredient from a diet (ensure confirmation popovers on the frontend).

---

## 2. Advanced Paginated Analytical Dashboard

The dashboard needs to aggregate monthly data and allow "Month-over-Month" (MoM) pagination, showing total expenses, ingredient counts, and a PO Price vs. Patient Count chart.

### 2.1 API Route: `/api/analytics`
- **Endpoint**: `GET /api/analytics`
- **Query Params**: `month=YYYY-MM` (Defaults to the current month if not provided).
- **Response Shape**:
  ```json
  {
    "month": "YYYY-MM",
    "totalExpense": 15400.50,
    "totalIngredientTypes": 45,
    "chartData": [
      { "date": "YYYY-MM-01", "poCost": 500.0, "patientCount": 120 },
      ...
    ]
  }
  ```

### 2.2 Drizzle SQLite Query Strategies
Using `drizzle-orm`, the Fullstack Developer will aggregate data efficiently using SQLite's `LIKE` operator for date matching (`YYYY-MM%`).

1. **Total Expense Card**:
   ```typescript
   const expenseResult = await db.select({ total: sum(purchaseOrders.totalCost) })
     .from(purchaseOrders)
     .where(like(purchaseOrders.targetDate, `${month}%`));
   ```
2. **Total Ingredient Types Bought Card**:
   ```typescript
   const ingredientResult = await db.select({ count: countDistinct(poLineItems.ingredientId) })
     .from(poLineItems)
     .innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id))
     .where(like(purchaseOrders.targetDate, `${month}%`));
   ```
3. **PO Cost vs Patient Count Chart**:
   Since SQLite doesn't easily support full outer joins on aggregated subqueries, fetch the two datasets independently and merge them in JS/TS by date.
   - *Query A (PO Cost/Day)*: Group `purchaseOrders` by `targetDate`, sum `totalCost`.
   - *Query B (Patient Count/Day)*: Group `patientCensus` by `date`, sum `patientCount`.
   - *Merge Strategy*: Create a map of all days in the month, insert PO Cost and Patient Count respectively, and return as a sorted array of objects for Recharts/Chart.js.

---

## 3. App-Wide Dark Mode & Responsive Layout Refactoring

The hospital environment requires high legibility, proper dark mode (`slate-950`), and responsive navigation.

### 3.1 Dark Mode Configuration (`next-themes`)
1. **Dependencies**: Install `next-themes` and `lucide-react` (for icons).
2. **Provider**: Create `src/app/providers.tsx` returning `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>`. Wrap the `RootLayout` (`src/app/layout.tsx`).
3. **Tailwind Config**: Ensure `darkMode: 'class'` is set in Tailwind v4 configuration.
4. **Theme Toggle UI**: Add a Sun/Moon toggle button in the sidebar.
5. **Color Semantic Checks**: Map components to the specific UX guidelines (e.g., App Background `bg-slate-50 dark:bg-slate-950`, Surfaces `bg-white dark:bg-slate-900`).

### 3.2 Responsive Navigation & Sidebar Strategy
The Next.js Developer must construct a standard Dashboard layout:
1. **Layout Structure**: 
   ```tsx
   // src/app/(dashboard)/layout.tsx
   <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
     <Sidebar />
     <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
       {children}
     </main>
   </div>
   ```
2. **Sidebar Component (`<Sidebar />`)**:
   - **Desktop (`lg:`)**: Fixed width (`w-64`), standard flex column.
   - **Tablet (`md:`)**: Fixed narrow width (`w-20`), hiding text, showing icons only. Use group-hover tooltips for labels.
   - **Mobile (`< md`)**: Use Shadcn UI's `<Sheet side="left">` or a custom Off-Canvas drawer with `bg-black/50` overlay. Triggered by a Hamburger icon in a sticky Top App Bar.
3. **Chart Responsiveness**: Wrap the PO vs Patient chart in a `ResponsiveContainer` (if using Recharts) and a container with `overflow-x-auto` to allow horizontal scrolling on small mobile screens. Set `min-width` on the chart to ensure data points aren't compressed to an unreadable state. Touch targets on charts must be `44x44px` minimum.