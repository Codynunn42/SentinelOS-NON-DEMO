# SentinelOS Brand Kit v1.0

This package contains the production brand kit structure for SentinelOS, including vector/icon placeholders and release documentation.

## Package Tree

```text
sentinelos-brand-v1.0/
├── 01_vectors/
├── 02_icons/
└── 03_docs/
    ├── SOURCE_ASSET_INTAKE_2026-07-21.md
    ├── SentinelOS_Brand_Guidelines_v1.0.md
    ├── RELEASE_CHECKLIST_v1.0.md
    └── ASSET_MANIFEST_TEMPLATE_v1.0.sha256
```

## Notes

- Add finalized SVG source assets to `01_vectors/`.
- Add exported PNG/ICO icon outputs to `02_icons/`.
- Use `03_docs/RELEASE_CHECKLIST_v1.0.md` before publishing.
- Generate final checksums from actual assets and replace placeholder rows in `03_docs/ASSET_MANIFEST_TEMPLATE_v1.0.sha256`.

## Generate Final Manifest

After assets are added, generate checksums with:

```bash
pnpm run generate:brand-manifest
```

This writes `03_docs/ASSET_MANIFEST_v1.0.sha256` from files in `01_vectors/` and `02_icons/`.

## Validate Package Naming

Run required filename validation:

```bash
pnpm run check:brand-package
```

Run stricter release validation (requires generated manifest file):

```bash
pnpm run check:brand-package:release
```
