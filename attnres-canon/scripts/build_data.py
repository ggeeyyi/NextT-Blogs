"""Build blog/data.js from the arena v1 evidence and the published run records.

Every number the figures draw comes from files in this repository:
- the search rounds: dev BPB by update from evidence/checks/arena-v1-stage2-20261102/runs/<run>/metrics.jsonl, and the
  mean step time and parameter count of each run from checks.json beside them;
- the proxy check: dev BPB at update 512 of the compressed schedule from
  evidence/checks/arena-v1-stage1-20261101/analysis.json, and the prefix backtest from backtest.json;
- the formal runs: validation BPB, CORE and per-task scores from results/runs/<method>.json;
- the published results: every finished record in results/runs/ at the git ref given by --published-ref
  (default origin/main, so that results merged upstream after this branch was cut are counted; if the ref does not
  resolve, the working tree is used).

The tables in the two pages are written by hand; blog/scripts/check_numbers.py recomputes them from the evidence.

Run: python3 <post>/scripts/build_data.py. The evidence is read from the NextTransformer checkout named by the
NEXTTRANSFORMER_REPO environment variable, or from the post's parent directory when the post is blog/ of that checkout.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

POST = Path(__file__).resolve().parents[1]
ROOT = Path(os.environ.get("NEXTTRANSFORMER_REPO") or POST.parent).resolve()
STAGE1 = ROOT / "evidence/checks/arena-v1-stage1-20261101"
STAGE2 = ROOT / "evidence/checks/arena-v1-stage2-20261102"
RUNS = ROOT / "results/runs"
OUT = POST / "data.js"
LAST = 46875

# Search-round anchors and candidates that finished: method -> (round, run whose dev curve is plotted).
# attnres_moe16 is plotted from its completed rerun.
SEARCH = {
    "dense_full": ("anchor", "run_000038"),
    "attnres": ("anchor", "run_000039"),
    "attnres_gate": ("1", "run_000041"),
    "attnres_canon": ("1", "run_000042"),
    "attnres_full": ("1", "run_000043"),
    "attnres_deep": ("1", "run_000044"),
    "attnres_ve_all": ("1", "run_000045"),
    "attnres_moe": ("2", "run_000047"),
    "attnres_gate_canon": ("2", "run_000048"),
    "attnres_full_gate": ("2", "run_000049"),
    "attnres_full_canon": ("2", "run_000050"),
    "attnres_canon_abcd": ("2", "run_000052"),
    "attnres_moe16": ("2", "run_000053"),
    "attnres_full_canon_abcd": ("3", "run_000054"),
}
FORMAL = ["attnres_full_canon_abcd", "attnres", "mhc"]
# The eleven methods of the proxy check, by family, in the order the page lists them.
PROXY = [("base", ["attnres", "dense_full", "residual_standard"]),
         ("loop", ["deeploop", "fixed_recursive", "ut_act", "huginn"]),
         ("linear", ["gdn", "kda", "retnet", "elu_qknorm"])]
BACKTEST_SET = "eleven (decision rows)"
GATE = ("gated_attention_headwise", "dense_full")   # a published full run of the head-wise gate, and its base


def published_records(ref):
    """Every run record at a git ref, or in the working tree when the ref is empty or does not resolve."""
    def git(*args):
        return subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True)
    commit = git("rev-parse", "--short", ref).stdout.strip() if ref else ""
    if commit:
        names = [n for n in git("ls-tree", "--name-only", ref, "results/runs/").stdout.split() if n.endswith(".json")]
        return {Path(n).stem: json.loads(git("show", f"{ref}:{n}").stdout) for n in names}, f"{ref}@{commit}"
    return {p.stem: json.loads(p.read_text()) for p in sorted(RUNS.glob("*.json"))}, "working tree"


def require_evidence():
    if not STAGE2.is_dir():
        sys.exit(f"no arena v1 evidence under {ROOT}: set NEXTTRANSFORMER_REPO to a NextTransformer checkout with evidence/checks/")


def search():
    checks = json.loads((STAGE2 / "checks.json").read_text())["runs"]
    out = {}
    for method, (rnd, run) in SEARCH.items():
        rows = [json.loads(line) for line in (STAGE2 / "runs" / run / "metrics.jsonl").read_text().splitlines()]
        dev = [[row["step"], round(row["val_bpb"], 6)] for row in rows if row["event"] == "validation"]
        out[method] = {"round": rnd, "dev": dev, "stepSeconds": checks[run]["mean_step_seconds"],
                       "parameters": checks[run]["parameters"], "microBatch": checks[run]["micro_batch"]}
    return out


def noise():
    analysis = json.loads((STAGE2 / "analysis.json").read_text())
    return {"delta": round(analysis["delta"], 6), "line": round(analysis["threshold"], 6)}


def proxy():
    analysis = json.loads((STAGE1 / "analysis.json").read_text())
    methods = [m for _, group in PROXY for m in group]
    short = {m: analysis["c_dev_bpb_512"][m] for m in methods}
    final = {m: json.loads((RUNS / f"{m}.json").read_text())["finalBpb"] for m in methods}
    rank = lambda values: {m: sorted(values, key=values.get).index(m) + 1 for m in values}
    rs, rf = rank(short), rank(final)
    rows = [{"id": m, "family": family, "short": round(short[m], 4), "final": round(final[m], 4),
             "shortRank": rs[m], "finalRank": rf[m]} for family, group in PROXY for m in group]
    scores = analysis["eleven"]["c"]
    backtest = json.loads((STAGE1 / "backtest.json").read_text())["scores"][BACKTEST_SET]
    return {"methods": rows, "spearman": round(scores["spearman"], 3), "pairAccuracy": round(scores["pair_accuracy"], 3),
            "pairs": scores["pairs"], "wrongPairs": len(scores["wrong"]),
            "backtest": [[int(step), round(s["spearman"], 3), round(s["pair_accuracy"], 3)]
                         for step, s in sorted(backtest.items(), key=lambda kv: int(kv[0]))]}


def formal():
    out = {}
    for method in FORMAL:
        record = json.loads((RUNS / f"{method}.json").read_text())
        out[method] = {"val": [[p["step"], round(p["value"], 6)] for p in record["val"]],
                       "core": [[p["step"], round(p["value"] * 100, 3)] for p in record["core"]]}
    return out


def tasks():
    """Centered per-task scores (x100) at the last update for the final model and Block AttnRes."""
    last = lambda m: next(e for e in json.loads((RUNS / f"{m}.json").read_text())["taskEvaluations"] if e["step"] == LAST)["centered"]
    a, b = last("attnres_full_canon_abcd"), last("attnres")
    return [{"task": task, "a": round(a[task] * 100, 2), "b": round(b[task] * 100, 2)} for task in a]


def published(records):
    rows = []
    for method, record in sorted(records.items()):
        val, core = record.get("val") or [], record.get("core") or []
        if not val or not core or val[-1]["step"] != LAST or core[-1]["step"] != LAST:
            continue
        rows.append({"id": method, "name": record.get("name", method),
                     "bpb": round(val[-1]["value"], 5), "core": round(core[-1]["value"] * 100, 2)})
    return rows


def gate(records):
    """Validation BPB of the published head-wise gate run minus its base, by update (None if not published at the ref)."""
    if any(m not in records for m in GATE):
        return None
    val = {m: {p["step"]: p["value"] for p in records[m]["val"]} for m in GATE}
    core = {m: records[m]["core"][-1]["value"] * 100 for m in GATE}
    gap = [[step, round(val[GATE[0]][step] - val[GATE[1]][step], 6)] for step in sorted(val[GATE[0]]) if step and step in val[GATE[1]]]
    return {"gap": gap, "bpb": round(val[GATE[0]][LAST], 4), "baseBpb": round(val[GATE[1]][LAST], 4),
            "core": round(core[GATE[0]], 2), "baseCore": round(core[GATE[1]], 2)}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--published-ref", default="origin/main",
                        help="git ref whose results/runs/ counts as the published results ('' for the working tree)")
    args = parser.parse_args()
    require_evidence()
    records, source = published_records(args.published_ref)
    rows = published(records)
    data = {"meta": {"publishedSource": source, "publishedCount": len(rows)}, "search": search(), "noise": noise(),
            "proxy": proxy(), "formal": formal(), "tasks": tasks(), "published": rows, "gate": gate(records)}
    OUT.write_text("// Generated by scripts/build_data.py from the arena v1 evidence. Do not edit.\n"
                   "window.BLOG_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"wrote {OUT.relative_to(POST.parent)} ({OUT.stat().st_size:,} bytes); published results: {len(rows)} from {source}")


if __name__ == "__main__":
    main()
