"""Check the hand-written numbers of the blog against the arena v1 evidence.

The tables in blog/index.html (English) and blog/zh/index.html (Chinese) are typed by hand, and so are the numbers in the prose. This script
recomputes them from the repository's evidence and published run records, and fails if a page disagrees:
- Table 1 (tab-rules) holds sentences; the numbers it quotes are among the prose numbers below;
- Tables 2-4 (tab-round1, tab-round2, tab-marginal): dev BPB in
  evidence/checks/arena-v1-stage2-20261102/runs/<run>/metrics.jsonl;
- Table 5 (tab-matrix): the same dev BPB values, their difference from Block AttnRes and the step time relative to it
  (step seconds as build_data.py reads them);
- Tables 6-7 (tab-formal, tab-gap): results/runs/<method>.json; the second row of Table 7 compares two published runs
  and is read at the same git ref as build_data.py (--published-ref, default origin/main);
- Table 8 (tab-compute): platform GPU-hours of the exploration and the search from koala_jobs.json in
  evidence/checks/arena-v1-stage{0,1,2}-*, and of the formal run from the disclosure card results/arena/attnres-canon.json;
- prose: the proxy check (arena-v1-stage1-20261101), compute per stage, the screen threshold and the noise, step time,
  that the two components together gain more than their separate gains, and the count and order of the published
  results.
In Tables 2-6 the bold cells must be exactly the best value of each column.
It also checks that blog/data.js is the output of build_data.py for the same inputs.

Run: python3 <post>/scripts/check_numbers.py, with NEXTTRANSFORMER_REPO set as for build_data.py.
"""
import argparse
import html
import json
import re
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_data  # noqa: E402

ROOT = build_data.ROOT
POST = build_data.POST
STAGE0 = ROOT / "evidence/checks/arena-v1-stage0-20261031"
STAGE1 = ROOT / "evidence/checks/arena-v1-stage1-20261101"
STAGE2 = ROOT / "evidence/checks/arena-v1-stage2-20261102"
RUNS = ROOT / "results/runs"
CARD = ROOT / "results/arena/attnres-canon.json"
PAGES = {"zh": POST / "zh/index.html", "en": POST / "index.html"}
DEV_RUN = {method: run for method, (_, run) in build_data.SEARCH.items()}
DECAY_START = 16406   # 46,875 x (1 - 0.65): the last constant-LR evaluation is at update 16,250
LAST = 46875
FINAL = "attnres_full_canon_abcd"


def signed(value, digits=4):
    text = f"{abs(value):.{digits}f}"
    return ("−" if value < 0 else "+" if value > 0 else "") + text


def dev(method):
    rows = [json.loads(line) for line in (STAGE2 / "runs" / DEV_RUN[method] / "metrics.jsonl").read_text().splitlines()]
    return {row["step"]: row["val_bpb"] for row in rows if row["event"] == "validation"}


def gap_cells(a, b):
    """Validation BPB of a minus b at update 2,000, over the constant-LR phase from update 10,000, and at the end."""
    gap = lambda step: a[step] - b[step]
    constant = [gap(step) for step in a if 10000 <= step < DECAY_START]
    return [signed(gap(2000)), signed(statistics.mean(constant)), signed(gap(LAST))]


def compute():
    """Platform GPU-hours of the three parts: the exploration, the search and the final training."""
    hours = lambda stage: sum(job["gpu_hours"] for job in json.loads((stage / "koala_jobs.json").read_text()))
    note = json.loads(CARD.read_text())["research"]["computeNote"]
    formal = float(re.search(r"Formal: ([\d,.]+) GPU-hours", note).group(1).replace(",", ""))
    porting = float(re.search(r"about ([\d.]+) platform GPU-hours", note).group(1)) + float(re.search(r"about (\d+) minutes on 32 GPUs", note).group(1)) / 60 * 32
    return {"explore": hours(STAGE0) + hours(STAGE1), "search": hours(STAGE2), "final": formal, "porting": porting}


def expected_tables(published):
    out = {}
    # Table 8: GPU-hours used and share of the total, for the three parts and their sum.
    parts = compute()
    used = [round(parts[k]) for k in ("explore", "search", "final")]
    cells = []
    for value in used:
        cells += [f"{value:,}", f"{round(100 * value / sum(used))}%"]
    out["tab-compute"] = cells + [f"{sum(used):,}", "100%"]
    # Tables 2 and 3: dev BPB minus Block AttnRes at updates 512 and 2,000.
    curves = {m: dev(m) for m in DEV_RUN}
    delta = lambda m, step, base="attnres": curves[m][step] - curves[base][step]
    out["tab-round1"] = [signed(delta(m, step)) for m in ("attnres_full", "attnres_canon", "attnres_gate", "attnres_deep",
                                                           "attnres_ve_all") for step in (512, 2000)]
    out["tab-round2"] = [signed(delta(m, step)) for m in ("attnres_canon_abcd", "attnres_full_canon", "attnres_full_gate",
                                                           "attnres_gate_canon", "attnres_moe16", "attnres_moe")
                         for step in (512, 2000)]

    # Table 4: the effect at update 2,000 of adding one change to a base (columns: Block AttnRes, Full, Canon-A/C, gate).
    pairs = [("attnres_full", "attnres"), None, ("attnres_full_canon", "attnres_canon"), ("attnres_full_gate", "attnres_gate"),
             ("attnres_canon", "attnres"), ("attnres_full_canon", "attnres_full"), None, ("attnres_gate_canon", "attnres_gate"),
             ("attnres_gate", "attnres"), ("attnres_full_gate", "attnres_full"), ("attnres_gate_canon", "attnres_canon"), None]
    out["tab-marginal"] = ["—" if pair is None else signed(delta(pair[0], 2000, pair[1])) for pair in pairs]

    # Table 6: CORE x100 and periodic validation BPB at the last update.
    cells = []
    records = {m: json.loads((RUNS / f"{m}.json").read_text()) for m in ("dense_full", "attnres", "mhc", FINAL)}
    for record in records.values():
        cells += [f"{record['core'][-1]['value'] * 100:.2f}", f"{record['val'][-1]['value']:.4f}"]
    out["tab-formal"] = cells

    # Table 7: validation BPB gaps at three points; the last row is the published head-wise gate run against its base.
    val = {m: {p["step"]: p["value"] for p in record["val"]} for m, record in records.items()}
    cells = []
    cells += gap_cells(val[FINAL], val["attnres"])
    gate, base = build_data.GATE
    if gate in published and base in published:
        cells += gap_cells(*({p["step"]: p["value"] for p in published[m]["val"]} for m in (gate, base)))
    else:
        cells += [None, None, None]   # not published at this ref: the row is not checked
    out["tab-gap"] = cells

    # Table 5: per cell, dev BPB at update 2,000, its difference from Block AttnRes (none for the baseline itself) and the
    # step time relative to Block AttnRes.
    seconds = {m: v["stepSeconds"] for m, v in build_data.search().items()}
    matrix = []
    for m in ("attnres", "attnres_canon", "attnres_canon_abcd", "attnres_full", "attnres_full_canon", FINAL):
        cell = [f"{curves[m][2000]:.4f}"] + ([] if m == "attnres" else [signed(delta(m, 2000))])
        matrix.append(cell + [f"{seconds[m] / seconds['attnres']:.2f}"])
    return out, matrix


def expected_claims(data):
    """Numbers quoted in the prose: (what, zh phrase, en phrase). Each phrase must appear on its page."""
    proxy, search = data["proxy"], data["search"]
    backtest = {step: spearman for step, spearman, _ in proxy["backtest"]}
    ratio = search[FINAL]["stepSeconds"] / search["attnres"]["stepSeconds"]
    search_updates = 2000
    search_percent = round(100 * search_updates / LAST)
    count = data["meta"]["publishedCount"]
    parts = compute()
    near = lambda value, step=50: round(value / step) * step
    total = round(parts["explore"]) + round(parts["search"]) + round(parts["final"])
    assert 0.6 < round(parts["final"]) / total < 0.72, "the final run is not about two thirds of the compute"
    # Full AttnRes and Canon together gain more than their separate gains added (Table 5, update 2,000).
    at = lambda m: dict(map(tuple, search[m]["dev"]))[2000]
    block = at("attnres")
    synergy = [(at(both) - block) - ((at("attnres_full") - block) + (at(canon) - block))
               for both, canon in (("attnres_full_canon", "attnres_canon"), (FINAL, "attnres_canon_abcd"))]
    assert all(e < 0 for e in synergy), "the two together do not gain more than their separate gains"
    analysis = json.loads((STAGE2 / "analysis.json").read_text())
    return [
        ("exploration compute", f"约 {near(parts['explore'])} GPU 小时做前期探索", f"about {near(parts['explore'])} GPU-hours on exploration"),
        ("cost of one full run", f"{int(parts['final'] // 100 * 100):,} 多 GPU 小时", f"more than {int(parts['final'] // 100 * 100):,} GPU-hours"),
        ("search training length", f"每个候选只训练 {search_updates:,} 步，约为完整训练步数的 {search_percent}%", f"Each search candidate trained for only {search_updates:,} updates, about {search_percent}% of a full run"),
        ("total compute", f"合计 {total:,} GPU 小时", f"came to {total:,} GPU-hours"),
        ("screen threshold", f"差 {analysis['screen_threshold']:.3f} 以上", f"more than {analysis['screen_threshold']:.3f} behind"),
        ("noise", f"δ 约为 {analysis['delta']:.4f}", f"differ by about {analysis['delta']:.4f}"),
        ("proxy Spearman", f"只有 {proxy['spearman']:.2f}", f"only {proxy['spearman']:.2f}"),
        ("prefix 500", f"前缀的 Spearman 是 {backtest[500]:.2f}", f"a Spearman of {backtest[500]:.2f}"),
        ("prefix 2,000", f"达到 {backtest[2000]:.2f}", f"reaches {backtest[2000]:.2f}"),
        ("step time", f"{ratio:.2f} 倍", f"{ratio:.2f} times"),
        ("published count", f"{count} 个已发布结果", f"{count} published results"),
    ]


def raw_cells(page, table):
    block = re.search(rf'<figure class="tbl[^"]*" id="{table}">(.*?)</figure>', page, re.S).group(1)
    return re.findall(r'<td class="num[^"]*">(.*?)</td>', block, re.S)


def cells_of(page, table):
    return [html.unescape(re.sub(r"<[^>]+>", "", cell)).strip() for cell in raw_cells(page, table)]


def matrix_cells(page):
    """Table 5: the numbers of each cell in order (dev BPB, the difference if any, the step-time ratio)."""
    return [re.findall(r"[−+]?\d+\.\d+", html.unescape(re.sub(r"<[^>]+>", " ", cell))) for cell in raw_cells(page, "tab-matrix")]


# Bold marks the best value of a column: (numeric columns, the better direction of each).
BEST = {"tab-round1": [min, min], "tab-round2": [min, min], "tab-marginal": [min] * 4, "tab-formal": [max, min]}


def number(text):
    try:
        return float(text.replace("−", "-").replace("+", ""))
    except ValueError:
        return None


def wrong_bold(page, table):
    """Cells whose bold mark disagrees with 'best of its column', as (cell index, text)."""
    if table == "tab-matrix":
        raw = raw_cells(page, table)
        values = [float(cell[0]) for cell in matrix_cells(page)]
        return [(i, values[i]) for i, cell in enumerate(raw) if ("<strong>" in cell) != (values[i] == min(values))]
    picks, raw, texts = BEST[table], raw_cells(page, table), cells_of(page, table)
    wrong = []
    for column, pick in enumerate(picks):
        index = range(column, len(texts), len(picks))
        best = pick(v for v in (number(texts[i]) for i in index) if v is not None)
        wrong += [(i, texts[i]) for i in index if ("<strong>" in raw[i]) != (number(texts[i]) == best)]
    return wrong


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--published-ref", default="origin/main")
    args = parser.parse_args()
    build_data.require_evidence()
    failures = 0

    # data.js must be what build_data.py writes for the same inputs.
    records, source = build_data.published_records(args.published_ref)
    rows = build_data.published(records)
    fresh = {"meta": {"publishedSource": source, "publishedCount": len(rows)}, "search": build_data.search(), "noise": build_data.noise(),
             "proxy": build_data.proxy(), "formal": build_data.formal(), "published": rows, "gate": build_data.gate(records)}
    text = build_data.OUT.read_text()
    data = json.loads(text[text.index("{"):text.rindex("}") + 1])
    if data != json.loads(json.dumps(fresh)):
        failures += 1
        print("MISMATCH data.js is stale: run scripts/build_data.py")

    want, matrix = expected_tables(records)
    claims = expected_claims(data)
    for lang, path in PAGES.items():
        page = path.read_text()
        for table, cells in want.items():
            got = cells_of(page, table)
            wrong = [(i, g, w) for i, (g, w) in enumerate(zip(got, cells)) if w is not None and g != w]
            if len(got) != len(cells) or wrong:
                failures += 1
                print(f"MISMATCH {path.relative_to(POST.parent)} {table}: {len(got)} cells, expected {len(cells)}; first differences {wrong[:5]}")
        if matrix_cells(page) != matrix:
            failures += 1
            print(f"MISMATCH {path.relative_to(POST.parent)} tab-matrix: {matrix_cells(page)}, expected {matrix}")
        for table in [*BEST, "tab-matrix"]:
            if wrong_bold(page, table):
                failures += 1
                print(f"MISMATCH {path.relative_to(POST.parent)} {table}: bold is not the best of its column at {wrong_bold(page, table)}")
        body = html.unescape(re.sub(r"<[^>]+>", "", page))
        old_cap = "最多训练完整预算的 4%" if lang == "zh" else "at most 4%"
        if old_cap in body:
            failures += 1
            print(f"MISMATCH {path.relative_to(POST.parent)} search length: 4% is rounded, not an exact cap")
        for what, zh, en in claims:
            phrase = zh if lang == "zh" else en
            if phrase not in body:
                failures += 1
                print(f"MISSING {path.relative_to(POST.parent)} {what}: expected the phrase {phrase!r}")

    # Claims that are not a single number.
    by_core = max(rows, key=lambda r: r["core"])["id"]
    by_bpb = min(rows, key=lambda r: r["bpb"])["id"]
    second = (sorted(rows, key=lambda r: -r["core"])[1]["id"], sorted(rows, key=lambda r: r["bpb"])[1]["id"])
    for ok, message in [(by_core == FINAL and by_bpb == FINAL, f"first by CORE is {by_core}, first by validation BPB is {by_bpb}"),
                        (second == ("mhc", "mhc"), f"second by CORE and by validation BPB are {second}, not mHC")]:
        if not ok:
            failures += 1
            print("MISMATCH", message)
    if want["tab-gap"][-1] is None:
        print(f"note: {build_data.GATE[0]} is not published at {source}; the last row of Table 7 was not checked")
    print(f"published results: {len(rows)} from {source}; first by CORE and by validation BPB: {by_core}")
    print("tables checked:", ", ".join([*want, "tab-matrix"]), "with their bold marks, and", len(claims), "prose numbers on", len(PAGES), "pages;",
          "FAILED" if failures else "all match")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
