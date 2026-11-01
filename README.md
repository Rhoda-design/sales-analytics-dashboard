# PulseSales - Sales Analytics Dashboard

A responsive, single-page sales analytics dashboard built with vanilla HTML, CSS, and JavaScript. Zero external frameworks, zero charting libraries, and zero CSS variables.

## Features

- **Executive KPI Cards**: Real-time calculations for Gross Revenue, Net Realized Revenue, Completed Orders, Average Order Value (AOV), and Fulfillment Rate.
- **Interactive Visualizations (HTML5 Canvas)**:
  - **Revenue & Orders Trajectory**: Multi-metric time-series line chart with area gradient fill, date labels, and interactive tooltips.
  - **Revenue by Category**: Donut chart breakdown (Software, Subscriptions, Services, Hardware) with dynamic percentages.
  - **Acquisition Channel Performance**: Bar chart comparing Direct Sales, Online Store, Partner Referrals, and Inbound Calls.
  - **Top Products Leaderboard**: Ranked products with volume metrics and revenue progress tracks.
- **Transactions Management**:
  - Full-text search and filtering by Category and Status.
  - Multi-column sorting (Date, Customer, Product, Amount, Status).
  - Client-side pagination.
  - Inline actions to view receipts or delete records.
  - **Record Sale Modal**: Add custom transactions that update all KPIs and visualizations in real time.
- **Persistence & Export**:
  - Uses browser `localStorage` for offline persistence across reloads.
  - One-click CSV export of transaction data.
  - Reset button to restore the initial sample dataset at any time.

## Running Locally

Simply open `index.html` in any modern web browser:

```bash
open index.html
```
