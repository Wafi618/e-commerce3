# E-commerce Site Technical Review

## Stack and Tooling Overview
- The project is a Next.js 14 / React 18 application with Tailwind CSS, Prisma ORM, JWT auth utilities, and Stripe/bKash payment integrations listed in dependencies.
- Package scripts include standard Next.js dev/build/start plus linting and Prisma client generation on postinstall.

## Application Architecture
- The `AppProvider` composes UI, notification, messaging, authentication, theme, cart, product, and order providers to supply cross-cutting state across the app.
- Context diagrams document dependencies: UI and Message providers are independent, Cart depends on Auth and UI, Product depends on UI search refs, and Order consumes UI view plus Product and Message fetchers.
- Data-flow diagrams describe authentication, logout, guest vs. logged-in cart handling, checkout redirection, search debouncing, and admin order updates that refresh product stock.

## Domain Models and Database
- Prisma models cover Users (with role, dark mode preference, contact info, and password reset PIN state), Products (decimal pricing, images array, stock, category/subcategory), Orders (shipping fields, payment metadata, status enum), Messages (for inter-user and password-reset flows), OrderItems, and CartItems with appropriate indexes and relational constraints.

## API Surface (example)
- `pages/api/products` supports GET with category/search filtering and POST with validation for name/price/stock/category, normalizing price/stock, and defaulting placeholder imagery; results are ordered by creation date.

## Frontend Experience Highlights
- Home page renders a particle background, dark-mode-aware styling, category chips, error/empty/loading states with skeleton cards, and product cards that deep-link to detail pages.
- Each product card shows price, stock, and actions for viewing details or adding to cart (disabled when out of stock) with add-to-cart animation.
- The shared `Layout` provides navigation with Google Translate widget, dark mode toggle, auth/login/logout controls, customer links (profile, orders, messages), admin link, responsive mobile menu, and live cart badge updates.

