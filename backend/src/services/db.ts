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

const isSqliteUrl =
  typeof process.env.DATABASE_URL === "string" &&
  process.env.DATABASE_URL.trim().startsWith("file:");

let prisma: any = createMockPrisma();
let hasDatabase = false;

if (isSqliteUrl) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    hasDatabase = true;
  } catch (err) {
    console.warn("[AI Studio] Database client initialization failed — using in-memory mock:", err);
    prisma = createMockPrisma();
    hasDatabase = false;
  }
}

export { prisma, hasDatabase };
export const databaseReady = true;
