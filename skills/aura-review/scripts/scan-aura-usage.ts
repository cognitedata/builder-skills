import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.cognite-bundles',
]);

function walkSourceFiles(rootDir: string, extensions: string[]): string[] {
  const files: string[] = [];
  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
        continue;
      }
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  walk(rootDir);
  return files;
}

function pascalCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

interface SlugPascalEntry {
  slug: string;
  pascal: string;
}

function buildSlugPascalIndex(availableSlugs: string[]): SlugPascalEntry[] {
  return availableSlugs
    .map((slug) => ({ slug, pascal: pascalCase(slug) }))
    .sort((a, b) => b.pascal.length - a.pascal.length);
}

function resolveSlugForIdentifier(
  identifier: string,
  slugsByPascalLengthDesc: SlugPascalEntry[]
): string | undefined {
  return slugsByPascalLengthDesc.find(({ pascal }) =>
    identifier.startsWith(pascal)
  )?.slug;
}

function loadAvailableComponentSlugs(appDir: string): string[] {
  const packageJsonPath = path.join(
    appDir,
    'node_modules/@cognite/aura/package.json'
  );
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      `Could not find @cognite/aura package.json at ${packageJsonPath}. ` +
        'Make sure npm/pnpm install completed before running this scan.'
    );
  }
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf-8')
  ) as { exports: Record<string, unknown> };
  return Object.keys(packageJson.exports)
    .filter((key) => key.startsWith('./components/'))
    .map((key) => key.slice('./components/'.length));
}

const STRUCTURAL_IDENTIFIER_DENYLIST = new Set([
  'Fragment',
  'StrictMode',
  'Suspense',
  'ErrorBoundary',
  'BrowserRouter',
  'Route',
  'Routes',
  'Outlet',
  'Link',
  'NavLink',
]);

function collectImports(source: ts.SourceFile): Map<string, string> {
  const importsByIdentifier = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral)
      .text;
    const clause = statement.importClause;
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings))
      continue;
    for (const element of clause.namedBindings.elements) {
      const localName = element.name.text;
      importsByIdentifier.set(localName, moduleSpecifier);
    }
  }
  return importsByIdentifier;
}

function classifyImportSource(
  moduleSpecifier: string | undefined
): 'relative' | 'external' | 'unresolved-local' {
  if (!moduleSpecifier) return 'unresolved-local';
  if (moduleSpecifier.startsWith('.')) return 'relative';
  return 'external';
}

const SPACING_RE =
  /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-w|min-h|max-w|max-h|gap|space-x|space-y)-(?:\[[^\]]+\]|[\w.%]+)\b/;
const RAW_COLOR_RE =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|grey|zinc|neutral|stone|black|white)(?:-\d{2,3})?\b/;
const ARBITRARY_VALUE_RE = /([a-zA-Z-]+)-\[[^\]]+\]/g;
const VARIANT_PREFIXES =
  /^(data|aria|group|peer|has|not|in|nth|supports|open|hover|focus|active)-/;
const TOKEN_ONLY_ARBITRARY_RE = /^\[[^\]]*var\(--[^)]+\)[^\]]*\]$/;

function hasGenuineArbitraryValue(region: string): boolean {
  return [...region.matchAll(ARBITRARY_VALUE_RE)].some(
    (m) =>
      !VARIANT_PREFIXES.test(`${m[1]}-`) &&
      !TOKEN_ONLY_ARBITRARY_RE.test(m[0].slice(m[0].indexOf('[')))
  );
}

function classifyClassNameRegion(region: string): string[] {
  const categories: string[] = [];
  if (SPACING_RE.test(region)) categories.push('spacing');
  if (RAW_COLOR_RE.test(region)) categories.push('color');
  if (hasGenuineArbitraryValue(region)) categories.push('arbitrary-value');
  return categories;
}

interface AuraElementUsage {
  identifier: string;
  slug: string;
  isRootComponent: boolean;
  file: string;
  line: number;
  classNameRegion: string | null;
  escapeHatchCategories: string[];
}

interface NonAuraElementUsage {
  identifier: string;
  file: string;
  line: number;
  importSource: 'relative' | 'external' | 'unresolved-local';
  moduleSpecifier: string | null;
}

interface ExcludedElementUsage {
  identifier: string;
  file: string;
  line: number;
  reason: 'structural-denylist' | 'namespaced-tag';
}

function scan(appDir: string): {
  availableAuraSlugs: string[];
  auraElementUsages: AuraElementUsage[];
  nonAuraUsages: NonAuraElementUsage[];
  excludedUsages: ExcludedElementUsage[];
} {
  const availableAuraSlugs = loadAvailableComponentSlugs(appDir);
  const slugIndex = buildSlugPascalIndex(availableAuraSlugs);
  const auraElementUsages: AuraElementUsage[] = [];
  const nonAuraUsages: NonAuraElementUsage[] = [];
  const excludedUsages: ExcludedElementUsage[] = [];
  const srcDir = path.join(appDir, 'src');

  for (const file of walkSourceFiles(srcDir, ['.tsx', '.ts'])) {
    const content = fs.readFileSync(file, 'utf-8');
    const source = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const importsByIdentifier = collectImports(source);

    function classNameRegionFor(attributes: ts.JsxAttributes): string | null {
      const classNameAttr = attributes.properties.find(
        (p): p is ts.JsxAttribute =>
          ts.isJsxAttribute(p) && p.name.getText(source) === 'className'
      );
      if (!classNameAttr?.initializer) return null;
      return `=${classNameAttr.initializer.getText(source)}`;
    }

    function visit(node: ts.Node): void {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const identifier = node.tagName.getText(source);
        if (/^[A-Z]/.test(identifier)) {
          const relativeFile = path.relative(appDir, file);
          const line =
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1;

          if (identifier.includes('.')) {
            excludedUsages.push({
              identifier,
              file: relativeFile,
              line,
              reason: 'namespaced-tag',
            });
          } else if (STRUCTURAL_IDENTIFIER_DENYLIST.has(identifier)) {
            excludedUsages.push({
              identifier,
              file: relativeFile,
              line,
              reason: 'structural-denylist',
            });
          } else {
            const moduleSpecifier =
              importsByIdentifier.get(identifier) ?? null;
            const slug = moduleSpecifier?.startsWith('@cognite/aura')
              ? (resolveSlugForIdentifier(identifier, slugIndex) ?? null)
              : null;

            if (slug) {
              const classNameRegion = classNameRegionFor(node.attributes);
              auraElementUsages.push({
                identifier,
                slug,
                isRootComponent: identifier === pascalCase(slug),
                file: relativeFile,
                line,
                classNameRegion,
                escapeHatchCategories: classNameRegion
                  ? classifyClassNameRegion(classNameRegion)
                  : [],
              });
            } else {
              nonAuraUsages.push({
                identifier,
                file: relativeFile,
                line,
                importSource: classifyImportSource(
                  moduleSpecifier ?? undefined
                ),
                moduleSpecifier,
              });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }

  return { availableAuraSlugs, auraElementUsages, nonAuraUsages, excludedUsages };
}

function main(): void {
  const args = process.argv.slice(2);
  const appDir = args[0];
  if (!appDir) {
    console.error('Usage: scan-aura-usage.ts <app-dir> [--out <file>]');
    process.exit(1);
  }
  const outIndex = args.indexOf('--out');
  const outFile = outIndex !== -1 ? args[outIndex + 1] : null;

  const {
    availableAuraSlugs,
    auraElementUsages,
    nonAuraUsages: allNonAuraUsages,
    excludedUsages,
  } = scan(path.resolve(appDir));

  const availableAuraComponents = availableAuraSlugs.map(pascalCase);

  const allAuraUsages = auraElementUsages.filter((u) => u.isRootComponent);

  function groupByIdentifier<T extends { identifier: string; file: string; line: number }>(
    items: T[],
    extra: (first: T) => Record<string, unknown>
  ): Array<{ identifier: string; usageCount: number; locations: { file: string; line: number }[] }> {
    const byIdentifier = new Map<string, T[]>();
    for (const item of items) {
      const group = byIdentifier.get(item.identifier) ?? [];
      group.push(item);
      byIdentifier.set(item.identifier, group);
    }
    return [...byIdentifier.entries()].map(([identifier, group]) => ({
      identifier,
      usageCount: group.length,
      locations: group.map((g) => ({ file: g.file, line: g.line })),
      ...extra(group[0]),
    }));
  }

  const auraUsages = groupByIdentifier(allAuraUsages, (first) => ({
    slug: first.slug,
  }));
  const nonAuraUsages = groupByIdentifier(allNonAuraUsages, (first) => ({
    importSource: first.importSource,
    moduleSpecifier: first.moduleSpecifier,
  }));

  const escapeHatches = auraElementUsages
    .filter((u) => u.escapeHatchCategories.length > 0)
    .map((u) => ({
      component: u.slug,
      tag: u.identifier,
      file: u.file,
      line: u.line,
      className: u.classNameRegion,
      categories: u.escapeHatchCategories,
    }));

  const totalUsages = auraUsages.length + nonAuraUsages.length;

  const result = {
    availableAuraComponents,
    totals: {
      totalUsages,
      auraUsages: auraUsages.length,
      nonAuraUsages: nonAuraUsages.length,
      allAuraUsages: allAuraUsages.length,
      allNonAuraUsages: allNonAuraUsages.length,
      auraCoveragePct:
        totalUsages === 0
          ? null
          : Math.round((auraUsages.length / totalUsages) * 1000) / 1000,
    },
    auraUsages,
    nonAuraUsages,
    escapeHatches,
    excludedUsages,
  };

  const json = JSON.stringify(result, null, 2);
  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, json);
    console.log(`Wrote scan results to ${outFile}`);
  } else {
    console.log(json);
  }
}

main();
