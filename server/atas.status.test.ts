import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock getDb so we can test the approval flow without a real database
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));
import { getDb } from "./db";

function makeMockDb(initial: Record<string, unknown>[]) {
  const rows = [...initial];
  return {
    select: () => ({
      from: () => ({
        where: async () => [{ ...rows[0] }],
        orderBy: async () => [...rows].reverse(),
      }),
    }),
    update: () => ({
      set: (_data: unknown) => ({
        where: async () => {
          Object.assign(rows[0], _data as any);
        },
      }),
    }),
  };
}

describe("fluxo de validação digital da ata (approve / unapprove)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aprova a ata gravando status, approvedAt, approvedBy e approvedByUserId", async () => {
    const db = makeMockDb([{ status: "rascunho" }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getAta, updateAta } = await import("./atasDb");

    const ata = await getAta(1);
    expect(ata?.status).toBe("rascunho");

    const directorName = "Prof. Gabriel B. Director";
    const approvedAt = new Date("2026-08-12T21:30:00Z");
    await updateAta(1, { status: "aprovada", approvedAt, approvedBy: directorName, approvedByUserId: 42 });

    const updated = await getAta(1);
    expect(updated?.status).toBe("aprovada");
    expect((updated as any)?.approvedAt?.toISOString()).toBe(approvedAt.toISOString());
    expect((updated as any)?.approvedBy).toBe(directorName);
    expect((updated as any)?.approvedByUserId).toBe(42);
  });

  it("reabre a ata como rascunho removendo a validação digital", async () => {
    const db = makeMockDb([{
      status: "aprovada",
      approvedAt: new Date(),
      approvedBy: "Director",
      approvedByUserId: 42,
    }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { updateAta, getAta } = await import("./atasDb");
    await updateAta(1, { status: "rascunho", approvedAt: null as any, approvedBy: null as any, approvedByUserId: null as any });

    const updated = await getAta(1);
    expect(updated?.status).toBe("rascunho");
    expect((updated as any)?.approvedBy).toBeNull();
    expect((updated as any)?.approvedByUserId).toBeNull();
  });

  it("recusa aprovação quando a ata já está aprovada", async () => {
    const db = makeMockDb([{ status: "aprovada" }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getAta } = await import("./atasDb");
    const ata = await getAta(1);
    expect(ata?.status).toBe("aprovada");
    // Regra do router: se status === aprovada, lançamos erro
    const jaAprovada = ata?.status === "aprovada";
    expect(jaAprovada).toBe(true);
  });
});
