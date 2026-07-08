-- Make warehouse_id nullable on inventory_logs so logs are always written
ALTER TABLE "inventory_logs" ALTER COLUMN "warehouse_id" DROP NOT NULL;
ALTER TABLE "inventory_logs" DROP CONSTRAINT IF EXISTS "inventory_logs_warehouse_id_fkey";
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_warehouse_id_fkey"
  FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add published_at to products (set retroactively for active products)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ;
UPDATE "products" SET "published_at" = "created_at" WHERE "status" = 'active' AND "published_at" IS NULL;

-- Add indexes for inventory_logs
CREATE INDEX IF NOT EXISTS "inventory_logs_shop_id_created_at_idx" ON "inventory_logs"("shop_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "inventory_logs_ref_id_idx" ON "inventory_logs"("ref_id") WHERE "ref_id" IS NOT NULL;

-- Backfill available_qty = stock_qty - reserved_qty for all variants
UPDATE "product_variants"
SET "available_qty" = GREATEST(0, "stock_qty" - "reserved_qty");
