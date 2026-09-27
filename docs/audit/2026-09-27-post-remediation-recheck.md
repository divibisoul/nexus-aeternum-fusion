# N03 post-remediation recheck — 2026-09-27

This additive record documents the current corrective pass:
- npm lockfile contains the remediated dependency graph;
- diagnostics use the repository's canonical package-lock workflow;
- dependency audit remains a blocking validation gate until the current PR HEAD is revalidated.


## Dependency remediation pass

The current N03 main failed `bun install --frozen-lockfile` because the Bun lockfile was stale. The current main also exposed an npm audit high-severity issue through Vite/esbuild.

This branch applies only an explicit compatible Vite toolchain update (Vite 7.3.6, plugin-react-swc 4.3.3, lovable-tagger 1.1.10) and regenerates both npm and Bun lockfiles under CI. No application module is being removed or replaced.
