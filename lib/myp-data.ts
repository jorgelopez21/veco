import { PrismaClient } from "@prisma/client";

// Instancia separada para MYP usando su propia URL
// Nota: Usamos una instancia genérica de Prisma, las consultas se harán vía $queryRaw
// para evitar conflictos de tipos con el esquema de Veco.
const mypDatabaseUrl =
  process.env.MYP_DATABASE_URL ||
  "postgresql://dummy:dummy@localhost:5432/dummy";

const mypPrisma = new PrismaClient({
  datasources: {
    db: {
      url: mypDatabaseUrl,
    },
  },
});

export async function queryMypInventory(productName?: string) {
  try {
    const query = productName
      ? `SELECT nombre_producto, stock_actual, precio_venta_estandar FROM productos WHERE nombre_producto ILIKE $1`
      : `SELECT nombre_producto, stock_actual, precio_venta_estandar FROM productos WHERE stock_actual > 0 ORDER BY stock_actual ASC LIMIT 10`;

    const params = productName ? [`%${productName}%`] : [];
    const result = await mypPrisma.$queryRawUnsafe(query, ...params);
    return result;
  } catch (error) {
    console.error("MYP Inventory Error:", error);
    return { error: "Failed to fetch MYP inventory" };
  }
}

export async function queryMypSales(days: number = 1) {
  try {
    const query = `
      SELECT v.fecha_venta, p.nombre_producto, v.cantidad, v.total_venta 
      FROM ventas v
      JOIN productos p ON v.id_producto = p.id_producto
      WHERE v.fecha_venta >= NOW() - INTERVAL '${days} days'
      ORDER BY v.fecha_venta DESC
    `;
    const result = await mypPrisma.$queryRawUnsafe(query);
    return result;
  } catch (error) {
    console.error("MYP Sales Error:", error);
    return { error: "Failed to fetch MYP sales" };
  }
}

export async function queryMypDebts() {
  try {
    const query = `
      SELECT c.nombre, SUM(v.total_venta - v.monto_pagado) as deuda
      FROM ventas v
      JOIN clientes c ON v.id_cliente = c.id_cliente
      WHERE v.estado_pago != 'Pagado'
      GROUP BY c.nombre
      HAVING SUM(v.total_venta - v.monto_pagado) > 0
    `;
    const result = await mypPrisma.$queryRawUnsafe(query);
    return result;
  } catch (error) {
    console.error("MYP Debts Error:", error);
    return { error: "Failed to fetch MYP debts" };
  }
}
