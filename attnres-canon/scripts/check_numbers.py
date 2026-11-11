"""Check the hand-written numbers of the blog against the arena v1 evidence.

The tables in blog/index.html (English) and blog/zh/index.html (Chinese) are typed by hand, and so are the numbers in the prose. This script
recomputes them from the repository's evidence and published run records, and fails if a page disagrees:
- Table 1 (tab-rules) holds sentences; the numbers it quotes are among the prose numbers below;
- Tables 2-4 (tab-round1, tab-round2, tab-marginal): dev BPB in
  evidence/checks/arena-v1-stage2-20261102/runs/<run>/metrics.jsonl;
- Table 5 (tab-matrix): the same dev BPB values, their difference from Block AttnRes and the step time relative to it
  (step seconds as build_data.py reads them);
- Tables 6-7 (tab-formal, tab-gap): results/runs/<method>.json; the last row of Table 7 compares two published runs
  and is read at the same git ref as build_data.py (--published-ref, default origin/main);
- Table 8 (tab-compute): platform GPU-hours of the exploration and the search from koala_jobs.json in
  evidence/checks/arena-v1-stage{0,1,2}-*, and of the formal run from the disclosure card results/arena/attnres-canon.json;
- prose: the exploration (trainer agreement in evidence/checks/arena-v1-stage0-20261031, the proxy check in
  arena-v1-stage1-20261101), compute per stage, the screen at update 512, the per-task CORE scores, the CORE
  evaluations, step time and parameter counts, and the count and order of the published results.
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

    # Table 6: CORE x100, CORE x100 without BoolQ and periodic validation BPB at the last update.
    cells = []
    records = {m: json.loads((RUNS / f"{m}.json").read_text()) for m in ("dense_full", "attnres", "mhc", FINAL)}
    for record in records.values():
        tasks = next(e for e in record["taskEvaluations"] if e["step"] == LAST)["centered"]
        rest = [value for name, value in tasks.items() if name != "boolq"]
        cells += [f"{record['core'][-1]['value'] * 100:.2f}", f"{sum(rest) / len(rest) * 100:.2f}", f"{record['val'][-1]['value']:.4f}"]
    out["tab-formal"] = cells

    # Table 7: validation BPB gaps at three points; the last row is the published head-wise gate run against its base.
    val = {m: {p["step"]: p["value"] for p in record["val"]} for m, record in records.items()}
    cells = []
    for a, b in ((FINAL, "attnres"), ("mhc", "attnres"), (FINAL, "mhc")):
        cells += gap_cells(val[a], val[b])
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
    proxy, tasks, search = data["proxy"], data["tasks"], data["search"]
    backtest = {step: spearman for step, spearman, _ in proxy["backtest"]}
    diffs = {t["task"]: t["a"] - t["b"] for t in tasks}
    better = sum(d > 0.005 for d in diffs.values()); worse = sum(d < -0.005 for d in diffs.values()); level = len(diffs) - better - worse
    lead = sum(diffs.values()) / len(diffs)
    boolq = diffs["boolq"] / len(diffs)
    rest = (sum(diffs.values()) - diffs["boolq"]) / (len(diffs) - 1)
    core = {m: dict(v["core"]) for m, v in data["formal"].items()}
    vs_block = [core[FINAL][s] - core["attnres"][s] for s in core[FINAL]]
    vs_mhc = [core[FINAL][s] - core["mhc"][s] for s in core[FINAL]]
    behind = sum(d < 0 for d in vs_mhc[:5])
    words = {3: ("三", "three")}
    ratio = search[FINAL]["stepSeconds"] / search["attnres"]["stepSeconds"]
    extra = search[FINAL]["parameters"] - search["attnres"]["parameters"]
    search_updates = 2000
    search_percent = round(100 * search_updates / LAST)
    count = data["meta"]["publishedCount"]
    right = proxy["pairs"] - proxy["wrongPairs"]
    # Compute per part (platform GPU-hours, rounded as the prose rounds them), trainer agreement and the screen at update 512.
    parts = compute()
    near = lambda value, step=50: round(value / step) * step
    explore, searched, trained = near(parts["explore"]), near(parts["search"]), near(parts["final"], 10)
    total = round(parts["explore"]) + round(parts["search"]) + round(parts["final"])
    share = lambda key: round(100 * round(parts[key]) / total)
    research = parts["explore"] + parts["search"]
    assert research / (research + parts["final"]) <= 1 / 3, "exploration and search exceed one third of the total compute"
    agreement = json.loads((STAGE0 / "acceptance.json").read_text())["A1"]
    assert all(m["step1_abs_diff"] == 0 and m["window_mean_abs_diff"] < 0.004 for m in agreement.values()), "trainer agreement"
    analysis = json.loads((STAGE2 / "analysis.json").read_text())
    furthest = max(c["gap_512_vs_dense_full"] for c in analysis["candidates"].values() if c.get("gap_512_vs_dense_full") is not None)
    assert furthest < analysis["screen_threshold"], "a candidate was screened out"
    return [
        ("exploration compute", f"约 {explore} GPU 小时做前期探索", f"about {explore} GPU-hours on exploration"),
        ("search compute", f"约 {searched} GPU 小时", f"about {searched} GPU-hours"),
        ("abstract: one third", "探索与搜索合计的算力不超过总预算的三分之一", "no more than one third of the total compute budget"),
        ("search training length", f"每个候选只训练 {search_updates:,} 步，约为完整训练步数的 {search_percent}%", f"Each search candidate trained for only {search_updates:,} updates, about {search_percent}% of a full run"),
        ("final training compute", f"耗时约 {trained:,} GPU 小时", f"took about {trained:,} GPU-hours"),
        ("cost of one full run", f"{int(parts['final'] // 100 * 100):,} 多 GPU 小时", f"more than {int(parts['final'] // 100 * 100):,} GPU-hours"),
        ("research within a third", "没有超过总算力的三分之一", "within one third of the total"),
        ("total compute", f"合计耗费 {total:,} GPU 小时", f"came to {total:,} GPU-hours"),
        ("research compute", f"加起来约 {near(parts['explore'] + parts['search'], 100)} GPU 小时", f"used about {near(parts['explore'] + parts['search'], 100)} GPU-hours"),
        ("porting checks", f"另用了约 {near(parts['porting'], 10)} GPU 小时", f"about {near(parts['porting'], 10)} GPU-hours more"),
        ("trainer agreement", "平均不到 0.004", "under 0.004 on average"),
        ("screen threshold", f"差 {analysis['screen_threshold']:.3f} 以上", f"more than {analysis['screen_threshold']:.3f} behind"),
        ("largest gap at update 512", f"只比 Dense Baseline 差 {furthest:.3f}", f"by only {furthest:.3f}"),
        ("noise", f"δ 约为 {analysis['delta']:.4f}", f"differ by about {analysis['delta']:.4f}"),
        ("proxy Spearman", f"只有 {proxy['spearman']:.2f}", f"only {proxy['spearman']:.2f}"),
        ("proxy pairs", f"{proxy['pairs']} 对方法里，短程训练只排对了 {right} 对", f"of the {proxy['pairs']} pairs"),
        ("proxy pairs right", f"排对了 {right} 对", f"ordered only {right} correctly"),
        ("prefix 500", f"前缀的 Spearman 是 {backtest[500]:.2f}", f"a Spearman of {backtest[500]:.2f}"),
        ("prefix 2,000", f"达到 {backtest[2000]:.2f}", f"reaches {backtest[2000]:.2f}"),
        ("tasks better/level/worse", f"{better} 项更好、{level} 项持平、{worse} 项更差", f"better on {better} of the {len(diffs)} tasks, level on {level} and worse on {worse}"),
        ("CORE lead", f"高的 {lead:.1f} 分里", f"its {lead:.1f} points over Block AttnRes"),
        ("BoolQ share", f"占了 {boolq:.1f} 分", f"accounts for {boolq:.1f}"),
        ("lead without BoolQ", f"缩小到 {rest:.1f} 分", f"shrinks to {rest:.1f}"),
        ("CORE vs mHC", f"前五次里有{words[behind][0]}次落后，直到最后一次才反超并领先 {vs_mhc[-1]:.1f} 分", f"trailed in {words[behind][1]} of the first five evaluations before pulling ahead to lead by {vs_mhc[-1]:.1f}"),
        ("step time", f"{ratio:.2f} 倍", f"{ratio:.2f} times"),
        ("extra parameters", f"约 {extra / 1e4:.0f} 万个参数", f"about {extra / 1e6:.2f} million parameters"),
        ("published count", f"{count} 个已发布结果", f"{count} published results"),
    ], all(d > 0 for d in vs_block), 100 * extra / search["attnres"]["parameters"]


def raw_cells(page, table):
    block = re.search(rf'<figure class="tbl[^"]*" id="{table}">(.*?)</figure>', page, re.S).group(1)
    return re.findall(r'<td class="num[^"]*">(.*?)</td>', block, re.S)


def cells_of(page, table):
    return [html.unescape(re.sub(r"<[^>]+>", "", cell)).strip() for cell in raw_cells(page, table)]


def matrix_cells(page):
    """Table 5: the numbers of each cell in order (dev BPB, the difference if any, the step-time ratio)."""
    return [re.findall(r"[−+]?\d+\.\d+", html.unescape(re.sub(r"<[^>]+>", " ", cell))) for cell in raw_cells(page, "tab-matrix")]


# Bold marks the best value of a column: (numeric columns, the better direction of each).
BEST = {"tab-round1": [min, min], "tab-round2": [min, min], "tab-marginal": [min] * 4, "tab-formal": [max, max, min]}


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
             "proxy": build_data.proxy(), "formal": build_data.formal(), "tasks": build_data.tasks(), "published": rows, "gate": build_data.gate(records)}
    text = build_data.OUT.read_text()
    data = json.loads(text[text.index("{"):text.rindex("}") + 1])
    if data != json.loads(json.dumps(fresh)):
        failures += 1
        print("MISMATCH data.js is stale: run scripts/build_data.py")

    want, matrix = expected_tables(records)
    claims, always_ahead, extra_percent = expected_claims(data)
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
                        (second == ("mhc", "mhc"), f"second by CORE and by validation BPB are {second}, not mHC"),
                        (always_ahead, "AttnRes-Canon is not above Block AttnRes at every CORE evaluation"),
                        (extra_percent < 0.1, f"extra parameters are {extra_percent:.3f}% of the model, not under 0.1%")]:
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
