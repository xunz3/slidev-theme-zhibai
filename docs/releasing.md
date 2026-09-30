# GitHub and npm releases

The source repository is [xunz3/slidev-theme-zhubai](https://github.com/xunz3/slidev-theme-zhubai), the default branch is `master`, and the npm package is `slidev-theme-zhubai`.

## Checks and artifacts

Use Node.js 24 (`nvm use`) and pnpm 11.13.1, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:release
pnpm run quality
pnpm run package:check
```

`ci.yml` runs on pull requests, pushes to `master`, and manual dispatch. It calls `quality.yml`, which runs the full browser quality suite, checks the npm file allowlist and relative imports, and creates an actual tarball. The `npm-package` artifact contains that tarball; `quality-evidence` retains diagnostics even when a gate fails. Demo builds, fixtures, tests, and local agent state are excluded from npm.

`publish.yml` runs when a GitHub Release is published. It requires the release tag to equal `v` plus `package.json`'s version and the prerelease checkbox to match the version suffix. It runs the quality workflow at the release commit, then downloads and publishes that run's validated tarball. Stable versions use `latest`; prereleases use `next`. Only the publishing job receives `id-token: write`. It uses a GitHub-hosted runner and npm 11.17.0, with no persistent npm token or dependency cache.

## One-time npm setup

The new package must exist before npm allows a trusted publisher to be configured. For its first publication, sign in to the intended npm owner account locally with `npm login`, check `npm whoami`, and enable account 2FA. Do not put npm credentials in source control or chat.

After merging the release commit and passing CI, download that commit's `npm-package` artifact from GitHub Actions. Publish the tarball once using the authenticated local npm CLI, for example for the initial stable release:

```sh
npm publish ./slidev-theme-zhubai-0.5.0.tgz --access public --tag latest --ignore-scripts
```

Then open the package's npm Settings → Trusted Publisher and configure:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Owner | `xunz3` |
| Repository | `slidev-theme-zhubai` |
| Workflow filename | `publish.yml` |
| Environment | Leave empty |
| Permission | Allow `npm publish` |

New trusted-publisher configurations can default to staged publishing; this workflow needs direct `npm publish` permission. For CLI setup with npm 11.15.0 or newer, see [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/). See npm's [trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for authentication requirements and provenance behavior.

The first version is already published by the bootstrap step. Do not trigger an automatic publication of that same version: npm versions cannot be overwritten. If creating its retrospective GitHub Release, temporarily disable `publish.yml` for that event, then re-enable it. Subsequent versions use the normal release path below.

## Subsequent releases

1. Update `package.json` to the intended version and merge the reviewed change to `master` after CI passes. There is no compiled npm distribution to rebuild manually.
2. Create a GitHub Release targeting that commit, with tag `vX.Y.Z` matching the package version. For `X.Y.Z-rc.1` or another prerelease, also select GitHub's prerelease checkbox.
3. Publish the GitHub Release. The workflow reruns quality checks and publishes the validated package with provenance using npm OIDC.
4. Check the workflow result and `npm view slidev-theme-zhubai version dist-tags`.

A draft release does not publish. A failed quality gate or mismatched version stops publication. If a run fails before npm accepts the package, fix the cause and rerun it. If npm already accepted the version, create a new version instead of trying to replace it. Keep `repository.url` and the trusted-publisher repository name in sync if the GitHub repository moves again.
