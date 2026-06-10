# Dataset v1 — Frozen

**Status:** FROZEN — Do not modify

**Created:** 2026-05-30

**Size:** 50,000 samples

## Structure

```
dataset_v1/
├── train/train.jsonl       (40,000 samples)
├── validation/val.jsonl     (5,000 samples)
├── test/test.jsonl          (5,000 samples)
├── processed/all.jsonl      (50,000 samples)
└── metadata/
    ├── split.json
    └── vocabulary.json
```

## Format

```json
{
  "instruction": "Generate a floor plan on a 60x80 plot with 4 bedrooms and 2 bathrooms",
  "input": "",
  "output": "{ blueprint json }"
}
```

## Stats

- Average rooms: 10.4
- Bedrooms: 1-6 (balanced)
- Bathrooms: 1-4 (balanced)
- Plot sizes: 30-100 × 40-120

## Rules

1. Never modify files in this directory
2. Create dataset_v2/ for new versions
3. Log all changes in metadata/changelog.json
