import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";
import {
  createTransaction,
  getOrCreateCategory,
} from "@/app/actions/transactions";
import { auth } from "@/auth";
import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  queryMypInventory,
  queryMypSales,
  queryMypDebts,
} from "@/lib/myp-data";

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Veco Tool][${requestId}] >>> PETICIÓN RECIBIDA`);

  let session;
  try {
    session = await auth();
    console.log(
      `[Veco Tool][${requestId}] Auth completado. Sesión:`,
      !!session?.user,
    );
  } catch (e) {
    console.error(`[Veco Tool][${requestId}] ERROR EN AUTH:`, e);
    return NextResponse.json({ error: "Auth Failure" }, { status: 500 });
  }

  if (!session || !session.user) {
    console.log(`[Veco Tool][${requestId}] 401 - No autorizado`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tool, parameters } = body;
    console.log(
      `[Veco Tool][${requestId}] Ejecutando: ${tool} con params:`,
      parameters,
    );

    // FINANCE TOOLS
    if (tool === "get_categories") {
      const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        select: { name: true, type: true },
      });
      console.log(
        `[Veco Tool][${requestId}] Categorías encontradas:`,
        categories.length,
      );
      return NextResponse.json({ categories });
    }

    if (tool === "create_transaction") {
      const { amount, description, category, type } = parameters;
      console.log(`[Veco Tool][${requestId}] Creando transacción...`);
      const typeUpper = type.toUpperCase();
      const transactionType: TransactionType =
        typeUpper === "INCOME"
          ? TransactionType.INCOME
          : TransactionType.EXPENSE;

      const cat = await getOrCreateCategory(category, transactionType);
      if (!cat) {
        console.error(
          `[Veco Tool][${requestId}] Error: No se pudo encontrar/crear categoría`,
        );
        return NextResponse.json(
          { error: "No category found" },
          { status: 400 },
        );
      }

      const result = await createTransaction({
        amount: Number(amount),
        description,
        categoryId: cat.id,
        date: new Date(),
        type: transactionType,
      });

      console.log(`[Veco Tool][${requestId}] Transacción completada.`);
      revalidatePath("/finance");
      return NextResponse.json(result);
    }

    if (tool === "query_transactions") {
      const { startDate, endDate } = parameters;
      console.log(
        `[Veco Tool][${requestId}] Consultando transacciones entre ${startDate} y ${endDate}`,
      );
      const where: Prisma.TransactionWhereInput = { userId: session.user.id };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: 10,
        include: { category: { select: { name: true } } },
      });

      console.log(
        `[Veco Tool][${requestId}] Transacciones halladas:`,
        transactions.length,
      );
      return NextResponse.json({ transactions });
    }

    // MYP TOOLS
    if (tool === "myp_query_inventory") {
      console.log(`[Veco Tool][${requestId}] Consultando Inventario MYP...`);
      const result = await queryMypInventory(parameters.product);
      return NextResponse.json(result);
    }

    if (tool === "myp_query_sales") {
      const result = await queryMypSales(parameters.days || 1);
      return NextResponse.json(result);
    }

    if (tool === "myp_query_debts") {
      const result = await queryMypDebts();
      return NextResponse.json(result);
    }

    console.warn(
      `[Veco Tool][${requestId}] 400 - Herramienta desconocida: ${tool}`,
    );
    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Error";
    console.error(`[Veco Tool][${requestId}] ERROR CRÍTICO EN API:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
