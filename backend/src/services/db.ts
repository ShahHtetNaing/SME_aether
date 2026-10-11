// MOCKED for AI Studio ephemeral runtime
const noOp = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  create: async (d: any) => d?.data ?? {},
  createMany: async () => ({ count: 0 }),
  update: async (d: any) => d?.data ?? {},
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
};

function createMockPrisma() {
  return new Proxy(
    {
      $transaction: async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : typeof ops === "function" ? ops() : ops,
    },
    {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        return new Proxy(noOp, { get: (t: any, p: string) => t[p] ?? (async () => []) });
      },
    },
  );
}

let prisma: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient();
} catch {
  console.warn("[AI Studio] Database not connected — using in-memory mock");
  prisma = createMockPrisma();
}

export { prisma };
export const databaseReady = true;
