# UX/UI Design Specifications: Hospital Nutrition Ledger (NCL V3.0)

## 1. Executive Summary
This document outlines the UX/UI guidelines for the NCL V3.0 update. The focus is on improving cognitive efficiency for hospital staff, ensuring high legibility across lighting conditions (Dark Mode), and creating a seamless responsive experience from mobile tablets on the hospital floor to desktop monitors in the administrative office.

## 2. Analytical Dashboard Layout Strategy

The dashboard is the operational hub. Information hierarchy must prioritize current-month insights while allowing quick historical comparisons.

### 2.1 Month-Based Pagination
- **Placement**: Top-right corner of the Dashboard view (Desktop) or sticky just below the header (Mobile).
- **Interaction**: A simple `< Previous Month | [Current Month Year] | Next Month >` toggle. A calendar icon can trigger a quick-jump popover for specific months to reduce click fatigue.
- **Feedback**: Changing the month must trigger a subtle loading skeleton for the cards and charts below to indicate data fetching without losing the structural context.

### 2.2 Summary Cards (Total Expense, Total Ingredient Types Bought)
- **Desktop/Tablet (Large)**: Displayed as a horizontal row (CSS Grid: `grid-cols-2` or `grid-cols-4` depending on final metric count) right below the page title and pagination. 
- **Mobile**: Stacked vertically (`flex-col` or `grid-cols-1`). 
- **Design**: Cards should feature large, highly legible typography for the numbers, accompanied by a subtle sparkline or a percentage indicator showing Month-over-Month (MoM) change.

### 2.3 Charts (PO Price vs Patient Count)
- **Desktop**: Placed beneath the Summary Cards. Use a dual-axis line or mixed bar/line chart. The chart should take up full container width (`w-full`) with a max-height of around `400px` to keep it within the viewport alongside the cards.
- **Mobile**: The chart must be horizontally scrollable if data points are dense, or simplified to show weekly aggregates instead of daily to prevent the UI from becoming unreadable. Ensure touch targets on data points are at least `44x44px`.

## 3. Master Data UI: Menu Templates (Recipes)

Defining recipes requires managing hierarchical data (`Diets` -> `Ingredients` -> `Grammage`). 

- **Layout Model**: Split-screen (Desktop) or List-to-Detail push (Mobile). 
- **Desktop**: 
  - Left pane: Searchable/filterable list of **Diets** (e.g., "Standard", "Low Sodium", "Diabetic").
  - Right pane: When a diet is selected, show the **Recipe Builder**. This is a table of **Ingredients** with inline-editable input fields for **Grammage** and unit selections.
- **Mobile**:
  - Tap a Diet from the main list -> navigates to a new view (or opens a full-screen modal) containing the Recipe Builder.
- **Interactions**: Use "Add Ingredient" as a floating action button or clear text button at the bottom of the ingredient list. Deleting an ingredient should require a confirmation swipe (mobile) or icon click + confirm tooltip (desktop) to prevent accidental data loss.

## 4. App-Wide Dark Mode & Tailwind v4 Color Strategy

Hospital environments have highly variable lighting (brightly lit kitchens vs. dim wards at night). Dark mode is crucial for reducing eye strain.

We will utilize Tailwind v4's `dark:` variant approach alongside CSS variables for semantic theming.

### 4.1 Color Palette Strategy
| Element | Light Mode (Default) | Dark Mode (`dark:`) |
| :--- | :--- | :--- |
| **App Background** | `bg-slate-50` | `dark:bg-slate-950` |
| **Surface/Cards** | `bg-white` | `dark:bg-slate-900` |
| **Primary Text** | `text-slate-900` | `dark:text-slate-50` |
| **Secondary Text** | `text-slate-500` | `dark:text-slate-400` |
| **Borders/Dividers**| `border-slate-200` | `dark:border-slate-800` |
| **Primary Action** | `bg-indigo-600 hover:bg-indigo-700` | `dark:bg-indigo-500 dark:hover:bg-indigo-400` |
| **Destructive/Error**| `bg-red-600` / `text-red-600` | `dark:bg-red-500` / `dark:text-red-400` |

### 4.2 Implementation Notes
- Avoid pure black (`#000000`) for backgrounds to reduce astigmatism halation. `slate-950` provides a softer, professional dark theme.
- Ensure all charts have a dark-mode specific theme (e.g., gridlines adjusting to `dark:stroke-slate-800`, text adjusting to `dark:fill-slate-400`).

## 5. Responsive Navigation & Sidebar

- **Desktop (>= 1024px)**: 
  - **Persistent Left Sidebar**: Width fixed to `256px` (`w-64`).
  - Contains main navigation links, user profile at the bottom, and a global Light/Dark mode toggle.
- **Tablet (768px - 1023px)**:
  - **Mini Sidebar**: Collapsed to icon-only mode (`w-16` or `w-20`) to maximize screen real estate for the data tables and charts. Hovering or tapping expands the tooltip.
- **Mobile (< 768px)**:
  - **Top App Bar**: Contains the App Logo/Title and a Hamburger Menu icon.
  - **Off-Canvas Drawer**: Tapping the hamburger menu slides out the sidebar from the left (`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform`). A semi-transparent overlay (`bg-black/50`) must cover the main content, allowing users to tap out to close the menu.

## 6. Accessibility & Compliance (A11y)
- **Contrast Ratios**: Ensure all text passes WCAG 2.1 AA standards (4.5:1 for normal text) in both light and dark modes.
- **Focus States**: Every interactive element (buttons, inputs, links) must have a visible focus ring (e.g., `focus:ring-2 focus:ring-indigo-500 focus:outline-none`).
- **Touch Targets**: All mobile buttons and interactive chart elements must have a minimum touch target size of `44x44px`.