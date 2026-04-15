-- Initial configuration for Veco Clean Install
-- Run via: psql $DATABASE_URL -f prisma/seed.sql
-- NOTE: Canonical defaults are managed in lib/provision.ts
--       This file is kept for reference / manual recovery only.

-- Insert Demo User
INSERT INTO "User" (id, email, name, "createdAt", "updatedAt")
VALUES ('clx-demo-user-id-veco', 'contacto@minube.dev', 'Demo User', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert Accounts for Demo User
INSERT INTO "BankAccount" (id, "userId", name, type, balance, currency, color, "createdAt", "updatedAt")
VALUES
  ('macc-clx-demo-user-id-veco',   'clx-demo-user-id-veco', 'Bancolombia',  'SAVINGS', 0, 'COP', '#3b82f6', NOW(), NOW()),
  ('cash-clx-demo-user-id-veco',   'clx-demo-user-id-veco', 'Efectivo',           'CASH',    0, 'COP', '#10b981', NOW(), NOW()),
  ('energy-clx-demo-user-id-veco', 'clx-demo-user-id-veco', 'Celsia', 'ENERGY',  0, 'COP', '#f59e0b', NOW(), NOW()),
  ('tarj-clx-demo-user-id-veco',   'clx-demo-user-id-veco', 'TC Nu',    'CREDIT',  0, 'COP', '#ec4899', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Expense Categories (manually created defaults)
INSERT INTO "Category" (id, "userId", name, type, icon, color, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Recargas',      'EXPENSE', 'Car',          '#10b981', NOW(), NOW()),
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Peajes',        'EXPENSE', 'Car',          '#b73a10', NOW(), NOW()),
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Mantenimiento', 'EXPENSE', 'Car',          '#30db1a', NOW(), NOW()),
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Lavadas',       'EXPENSE', 'Car',          '#cfe52a', NOW(), NOW()),
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Impuestos',     'EXPENSE', 'Car',          '#1042b7', NOW(), NOW()),
  (gen_random_uuid()::text, 'clx-demo-user-id-veco', 'Parqueadero',   'EXPENSE', 'Car',          '#64748b', NOW(), NOW())
ON CONFLICT ("userId", name, type) DO NOTHING;

-- Insert Deepal S05 Demo Vehicle
INSERT INTO "Vehicle" (id, "userId", brand, model, "batteryCapacity", degradation, "createdAt", "updatedAt")
VALUES
  ('veh-clx-demo-user-id-veco', 'clx-demo-user-id-veco', 'Changan', 'Deepal S05', 56.1, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Mark as provisioned
UPDATE "User" SET "isProvisioned" = true WHERE id = 'clx-demo-user-id-veco';
