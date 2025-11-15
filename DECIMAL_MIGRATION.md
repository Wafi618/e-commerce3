# Decimal Type Migration for Monetary Fields

## Problem
Previously, all monetary fields were using `Float` type:
```prisma
model Product {
  price Float  // ❌ Can cause precision errors
}

model Order {
  total Float  // ❌ Can cause precision errors
}

model OrderItem {
  price Float  // ❌ Can cause precision errors
}
```

### Why Float is problematic for money:
- **Precision errors**: `0.1 + 0.2 = 0.30000000000000004` in floating point
- **Rounding issues**: Can accumulate over many transactions
- **Financial compliance**: Not suitable for accurate financial calculations
- **Example**: `19.99 * 3 = 59.970000000000006` instead of `59.97`

## Solution
Migrated all monetary fields to `Decimal(10,2)` type:
```prisma
model Product {
  price Decimal @db.Decimal(10, 2)  // ✅ Precise to 2 decimal places
}

model Order {
  total Decimal @db.Decimal(10, 2)  // ✅ Precise to 2 decimal places
}

model OrderItem {
  price Decimal @db.Decimal(10, 2)  // ✅ Precise to 2 decimal places
}
```

## Changes Made

### 1. Schema Updates ([prisma/schema.prisma](prisma/schema.prisma))
- `Product.price`: `Float` → `Decimal @db.Decimal(10, 2)`
- `Order.total`: `Float` → `Decimal @db.Decimal(10, 2)`
- `OrderItem.price`: `Float` → `Decimal @db.Decimal(10, 2)`

### 2. Database Migration
Created migration file: `prisma/migrations/20251008_use_decimal_for_money/migration.sql`

```sql
-- Convert Float to Decimal for all monetary fields
ALTER TABLE "Product" ALTER COLUMN "price" TYPE DECIMAL(10,2);
ALTER TABLE "Order" ALTER COLUMN "total" TYPE DECIMAL(10,2);
ALTER TABLE "OrderItem" ALTER COLUMN "price" TYPE DECIMAL(10,2);
```

### 3. Prisma Client
Regenerated Prisma Client with `npx prisma generate` to include new Decimal types.

## How Decimal Works

### In TypeScript/JavaScript
Prisma returns Decimal as a `Prisma.Decimal` object (from `decimal.js` library):

```typescript
// Reading from database
const product = await prisma.product.findUnique({ where: { id: 1 } });
product.price // Prisma.Decimal object

// Can be used in calculations
const total = product.price.mul(quantity); // Precise multiplication

// Convert to number for display
const priceNumber = product.price.toNumber();
const priceString = product.price.toFixed(2); // "19.99"

// Writing to database - accepts number or string
await prisma.product.create({
  data: {
    price: 19.99,      // ✅ Converted to Decimal
    // or
    price: "19.99"     // ✅ Also works
  }
});
```

### Backwards Compatibility
✅ **No code changes required!** The existing code works perfectly because:
- JavaScript numbers are automatically converted to Decimal when writing
- Decimal objects can be used in arithmetic operations
- `.toFixed(2)` works on Decimal objects
- `.reduce()` and other array methods work correctly

## Benefits

### ✅ Precision
```javascript
// Before (Float):
0.1 + 0.2 = 0.30000000000000004

// After (Decimal):
new Decimal(0.1).plus(0.2) = 0.3  // Exact!
```

### ✅ Financial Accuracy
```javascript
// Before (Float):
19.99 * 3 = 59.970000000000006

// After (Decimal):
new Decimal(19.99).times(3) = 59.97  // Exact!
```

### ✅ Database Storage
- PostgreSQL `DECIMAL(10,2)` stores exactly 2 decimal places
- No rounding errors in database
- Optimized for financial data

## Format Specification
`Decimal(10, 2)` means:
- **10**: Total number of digits (precision)
- **2**: Number of digits after decimal point (scale)
- Range: `-99,999,999.99` to `99,999,999.99`
- Perfect for typical e-commerce prices

## Testing
All existing tests pass without modification. The Decimal type is transparent to the application code.

## References
- [Prisma Decimal Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/decimal-type)
- [decimal.js Library](https://github.com/MikeMcl/decimal.js/)
- [PostgreSQL DECIMAL Type](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL)

## Recommendation
Always use `Decimal` for monetary values in databases. Never use `Float` or `Double` for money!
