import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { appRouter } from "./routers";

// Cada página simples declara um config com listKey/createKey/updateKey/deleteKey,
// e o CrudPage resolve-os via getRouter(). Se um nome não existir no mapa, o router
// vem `undefined` e a página rebenta com TypeError ao renderizar — foi exactamente
// o que aconteceu em /bi (DashboardPage usava o router "dashboard", inexistente).
// Este teste impede que a classe de erro se repita.

const crudPagePath = path.resolve(__dirname, "../client/src/components/CrudPage.tsx");
const pagesDir = path.resolve(__dirname, "../client/src/pages");

function readPages(): { file: string; content: string }[] {
  const out: { file: string; content: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
        out.push({ file: full, content: readFileSync(full, "utf8") });
      }
    }
  };
  walk(pagesDir);
  return out;
}

function getRouterMap(): Record<string, string> {
  const src = readFileSync(crudPagePath, "utf8");
  const start = src.indexOf("const routers: Record<string, any> = {");
  expect(start, "getRouter: mapa não encontrado em CrudPage.tsx").toBeGreaterThan(-1);
  const open = src.indexOf("{", start);
  const close = src.indexOf("\n  };", open);
  const body = src.slice(open + 1, close);
  const map: Record<string, string> = {};
  for (const m of body.matchAll(/^\s*(\w+):\s*trpc\.([\w.]+),?\s*$/gm)) {
    map[m[1]] = m[2];
  }
  return map;
}

function routerKeyExists(appRouterLike: Record<string, unknown>, dotted: string): boolean {
  let node: unknown = appRouterLike;
  for (const part of dotted.split(".")) {
    if (node === null || typeof node !== "object") return false;
    if (!(part in (node as Record<string, unknown>))) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return true;
}

// Remove comentários (linha e bloco) antes de procurar padrões, para que um
// comentário que DESCREVA o bug não dispare o teste — só o código conta.
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("integridade dos routers das páginas", () => {
  const map = getRouterMap();

  it("o mapa getRouter está preenchido e contém todos os módulos principais", () => {
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(20);
    for (const key of ["students", "courses", "teachers", "grades", "subjects", "classes"]) {
      expect(map, `falta o router "${key}" no mapa`).toHaveProperty(key);
    }
  });

  it("todos os routers do mapa existem no appRouter do backend", () => {
    const missing = Object.entries(map).filter(([, dotted]) => !routerKeyExists(appRouter as unknown as Record<string, unknown>, dotted));
    expect(missing, `routers em falta no backend: ${JSON.stringify(missing)}`).toEqual([]);
  });

  it("nenhuma página usa uma listKey/createKey/updateKey/deleteKey sem router", () => {
    const mapKeys = new Set(Object.keys(map));
    const problems: string[] = [];
    for (const { file, content } of readPages()) {
      const code = stripComments(content);
      for (const m of code.matchAll(/\b(listKey|createKey|updateKey|deleteKey):\s*["']([\w.]+)["']/g)) {
        const [, prop, value] = m;
        const root = value.split(".")[0];
        if (!mapKeys.has(root)) {
          problems.push(`${path.basename(file)}: ${prop}="${value}" não está no getRouter`);
        }
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("o bug de /bi não volta: nenhum router usa o nome inexistente \"dashboard\"", () => {
    expect(Object.keys(map)).not.toContain("dashboard");
    for (const { file, content } of readPages()) {
      expect(stripComments(content), `${path.basename(file)} referencia o router "dashboard"`).not.toMatch(/["']dashboard["']/);
    }
  });
});
