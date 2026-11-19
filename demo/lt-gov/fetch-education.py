#!/usr/bin/env python3
"""Build demo/lt-gov/data/education.json from the public Švietimo Duomenys MCP.

The browser never calls the API. This script talks to the free read-only
streamable HTTP endpoint at https://mcp.svietimas.lt/mcp, then writes a static
layer. Re-run it to refresh the file.

Reuse is the platform's own licence (naudojimosi-salygos, "Turinio pakartotinis
naudojimas ir šaltinio nurodymas", updated 2026-09-08): a free, non-exclusive
licence to copy, distribute and adapt their original analyses, including
commercially, without a separate permit, with attribution to VšĮ Švietimas
numeris vienas / duomenys.svietimas.lt and a note of what we changed.

What this file changes: English names of municipalities and of the index
categories are standard translations for the bilingual demo. The numbers are
copied. A blank average means the source does not publish one.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

MCP_URL = "https://mcp.svietimas.lt/mcp"
ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUT = DATA / "education.json"
STRUCTURE = DATA / "structure.json"

ATTRIBUTION = "Duomenys: duomenys.svietimas.lt (VšĮ Švietimas numeris vienas)"
SITE = "https://duomenys.svietimas.lt/"
INDEX_URL = "https://duomenys.svietimas.lt/indeksas"

# Genitive stem as published in the full Lithuanian name, to the usual English proper noun.
STEM = {
    "Akmenės": "Akmenė",
    "Alytaus": "Alytus",
    "Anykščių": "Anykščiai",
    "Birštono": "Birštonas",
    "Biržų": "Biržai",
    "Druskininkų": "Druskininkai",
    "Elektrėnų": "Elektrėnai",
    "Ignalinos": "Ignalina",
    "Jonavos": "Jonava",
    "Joniškio": "Joniškis",
    "Jurbarko": "Jurbarkas",
    "Kaišiadorių": "Kaišiadorys",
    "Kalvarijos": "Kalvarija",
    "Kauno": "Kaunas",
    "Kazlų Rūdos": "Kazlų Rūda",
    "Kelmės": "Kelmė",
    "Klaipėdos": "Klaipėda",
    "Kretingos": "Kretinga",
    "Kupiškio": "Kupiškis",
    "Kėdainių": "Kėdainiai",
    "Lazdijų": "Lazdijai",
    "Marijampolės": "Marijampolė",
    "Mažeikių": "Mažeikiai",
    "Molėtų": "Molėtai",
    "Neringos": "Neringa",
    "Pagėgių": "Pagėgiai",
    "Pakruojo": "Pakruojis",
    "Palangos": "Palanga",
    "Panevėžio": "Panevėžys",
    "Pasvalio": "Pasvalys",
    "Plungės": "Plungė",
    "Prienų": "Prienai",
    "Radviliškio": "Radviliškis",
    "Raseinių": "Raseiniai",
    "Rietavo": "Rietavas",
    "Rokiškio": "Rokiškis",
    "Skuodo": "Skuodas",
    "Tauragės": "Tauragė",
    "Telšių": "Telšiai",
    "Trakų": "Trakai",
    "Ukmergės": "Ukmergė",
    "Utenos": "Utena",
    "Varėnos": "Varėna",
    "Vilkaviškio": "Vilkaviškis",
    "Vilniaus": "Vilnius",
    "Visagino": "Visaginas",
    "Zarasų": "Zarasai",
    "Šakių": "Šakiai",
    "Šalčininkų": "Šalčininkai",
    "Šiaulių": "Šiauliai",
    "Šilalės": "Šilalė",
    "Šilutės": "Šilutė",
    "Širvintų": "Širvintos",
    "Švenčionių": "Švenčionys",
}

SUBJECT_EN = {
    "Lietuvių kalba": "Lithuanian language",
    "Matematika": "Mathematics",
}

# Copied exactly from get_table_schema recommended metrics. Do not rebuild it.
FUNDING_METRIC = {
    "alias": "finansavimas_vienam_mokiniui",
    "expression": 'SUM("finansavimas") / NULLIF(SUM("visu_mokiniu_skaicius_valstybinese_mokyklose"), 0)',
}


class MCPError(RuntimeError):
    pass


def mcp_call(name: str, arguments: dict | None = None) -> dict:
    """Call one tool. The server answers with a single JSON-RPC body."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments or {}},
    }
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        raw = res.read().decode()
        ctype = res.headers.get("Content-Type", "")
    if "text/event-stream" in ctype:
        chunks = []
        for line in raw.splitlines():
            if line.startswith("data:"):
                chunks.append(line[5:].strip())
        raw = chunks[-1] if chunks else ""
    body = json.loads(raw)
    if body.get("error"):
        raise MCPError(f"{name}: {body['error']}")
    content = (body.get("result") or {}).get("content") or []
    texts = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("text")]
    if not texts:
        raise MCPError(f"{name}: empty result")
    return json.loads("\n".join(texts))


def rows_as_dicts(result: dict) -> list[dict]:
    cols = result.get("columns") or []
    out = []
    for row in result.get("rows") or []:
        out.append({cols[i]: row[i] for i in range(len(cols))})
    return out


def whole_number(value):
    """Keep an integral count as an int. Leave a real fraction as a float. Blank stays None."""
    if value is None:
        return None
    number = float(value)
    if number.is_integer():
        return int(number)
    return number


def english_names(full: str) -> tuple[str, str] | None:
    kind = short_kind = None
    stem = None
    if full.endswith(" miesto savivaldybė"):
        stem = full[: -len(" miesto savivaldybė")]
        kind, short_kind = "City Municipality", "City"
    elif full.endswith(" rajono savivaldybė"):
        stem = full[: -len(" rajono savivaldybė")]
        kind, short_kind = "District Municipality", "District"
    elif full.endswith(" savivaldybė"):
        stem = full[: -len(" savivaldybė")]
        kind, short_kind = "Municipality", ""
    if not stem or stem not in STEM:
        return None
    base = STEM[stem]
    full_en = f"{base} {kind}"
    short_en = f"{base} {short_kind}".strip()
    return full_en, short_en


# Whole tokens only. A letter inside Marijampolė or Rietavas must stay.
_FOLD_TOKEN = re.compile(
    r"(?<!\S)(?:savivaldybė|savivaldybe|sav|miesto|rajono|m|r)\.?(?!\S)"
)


def fold_name(value: str) -> str:
    """Fold a name so 'Vilniaus miesto savivaldybė' and 'Vilniaus m.' compare equal.

    Drops the words miesto, rajono and savivaldybė, and the abbreviation tokens
    m., r. and sav. It does not strip the letters m or r out of a name.
    """
    text = _FOLD_TOKEN.sub(" ", (value or "").casefold())
    return " ".join(text.split())


def node_codes(node: dict) -> set[str]:
    found = set()
    for key in ("code", "official_code", "municipality_code", "savivaldybes_kodas"):
        if node.get(key) is not None:
            found.add(str(node[key]).strip())
    return found


def node_names(node: dict) -> set[str]:
    found = set()
    for key in ("title", "short", "kind"):
        value = node.get(key)
        if isinstance(value, dict):
            for lang in ("lt", "en"):
                if isinstance(value.get(lang), str):
                    found.add(fold_name(value[lang]))
        elif isinstance(value, str):
            found.add(fold_name(value))
    if isinstance(node.get("id"), str):
        found.add(fold_name(node["id"].replace("-", " ")))
    found.discard("")
    return found


def match_nodes(municipalities: list[dict], nodes: list[dict]) -> None:
    """Set node_id when a structure node carries the official code or the official name.

    A node that matches two municipalities is left unset and logged. The orbit map
    today is national offices, so a clean miss is expected and is not a failed fetch.
    """
    by_code: dict[str, list[str]] = {}
    by_name: dict[str, list[str]] = {}
    for node in nodes:
        nid = node.get("id")
        if not isinstance(nid, str):
            continue
        for code in node_codes(node):
            by_code.setdefault(code, []).append(nid)
        for name in node_names(node):
            by_name.setdefault(name, []).append(nid)

    matched = 0
    print(f"LT·GOV structure nodes considered: {len(nodes)}")
    for mun in municipalities:
        code = str(mun["code"])
        names = {fold_name(mun["name"]["lt"]), fold_name(mun["short"]["lt"])}
        names.discard("")
        hits = set(by_code.get(code, []))
        for name in names:
            hits.update(by_name.get(name, []))
        if len(hits) == 1:
            mun["node_id"] = next(iter(hits))
            matched += 1
            print(f"  matched {code} {mun['name']['lt']} -> {mun['node_id']}")
        else:
            mun["node_id"] = None
            if len(hits) > 1:
                print(f"  ambiguous {code} {mun['name']['lt']}: {sorted(hits)}", file=sys.stderr)
    unmatched = [m for m in municipalities if not m["node_id"]]
    print(f"Match rate: {matched} of {len(municipalities)} municipalities.")
    if unmatched:
        print(f"Unmatched ({len(unmatched)}):")
        for mun in unmatched:
            print(f"  {mun['code']:>3}  {mun['name']['lt']}")


def latest_funding(short_names: set[str]) -> tuple[str | None, dict[str, float | None]]:
    """Latest school year whose recommended per-pupil funding metric returns rows."""
    listed = mcp_call(
        "get_filter_values",
        {"table_name": "savivaldybiu_metiniai_rodikliai", "field": "mokslo_metai", "limit": 50},
    )
    years = sorted((str(y) for y in listed.get("values") or []), reverse=True)
    if not years:
        raise MCPError("no school years on savivaldybiu_metiniai_rodikliai")
    for year in years:
        result = mcp_call(
            "query_table",
            {
                "table_name": "savivaldybiu_metiniai_rodikliai",
                "metrics": [FUNDING_METRIC],
                "group_by": ["savivaldybe"],
                "filters": [{"field": "mokslo_metai", "op": "eq", "value": year}],
                "limit": 100,
            },
        )
        if result.get("has_more"):
            raise MCPError(f"funding query for {year} was truncated")
        found = {}
        for row in rows_as_dicts(result):
            found[row.get("savivaldybe")] = row.get("finansavimas_vienam_mokiniui")
        present = sum(1 for name in short_names if found.get(name) is not None)
        print(f"Funding {year}: {present} of {len(short_names)} municipalities have a figure.")
        if present:
            return year, found
    return None, {}


def latest_exams() -> dict[int, list[dict]]:
    """Latest published municipal average for each exam and subject.

    A null average means the source does not publish one (state exams). Those
    rows are left out rather than stored as empty.
    """
    result = mcp_call(
        "query_table",
        {
            "table_name": "egzaminu_rezultatai_savivaldybe",
            "columns": [
                "savivaldybes_kodas",
                "metai",
                "egzaminas",
                "dalykas",
                "vidutinis_balas",
            ],
            "limit": 5000,
        },
    )
    if result.get("has_more"):
        raise MCPError("exam query was truncated")
    best: dict[tuple, dict] = {}
    for row in rows_as_dicts(result):
        code = row.get("savivaldybes_kodas")
        year = row.get("metai")
        exam = row.get("egzaminas")
        subject = row.get("dalykas")
        if code is None or not isinstance(year, int) or not exam or not subject:
            continue
        key = (int(code), exam, subject)
        current = best.get(key)
        if current is None or year > current["year"]:
            best[key] = {"year": year, "average": row.get("vidutinis_balas"), "subject_lt": subject, "exam": exam}
    by_code: dict[int, list[dict]] = {}
    for (code, exam, subject), item in best.items():
        if item["average"] is None:
            continue
        subject_en = SUBJECT_EN.get(subject)
        if subject_en is None:
            print(f"  no English subject label for {subject!r}; keeping the Lithuanian name", file=sys.stderr)
            subject_en = subject
        by_code.setdefault(code, []).append(
            {
                "exam": exam,
                "subject": {"en": subject_en, "lt": subject},
                "year": item["year"],
                "average": item["average"],
            }
        )
    for code in by_code:
        by_code[code].sort(key=lambda e: (e["exam"], e["subject"]["lt"]))
    return by_code


def build() -> dict:
    index_rows = rows_as_dicts(
        mcp_call(
            "query_table",
            {
                "table_name": "savivaldybiu_indeksas",
                "columns": [
                    "savivaldybes_kodas",
                    "savivaldybe",
                    "strategines_lyderystes_balas",
                    "mokinio_itraukties_balas",
                    "pedagoginio_personalo_balas",
                    "ugdymo_pasiekimu_balas",
                    "strategines_lyderystes_svoris",
                    "mokinio_itraukties_svoris",
                    "pedagoginio_personalo_svoris",
                    "ugdymo_pasiekimu_svoris",
                    "sek",
                    "finalinis_balas",
                    "vieta",
                ],
                "order_by": [{"field": "vieta", "direction": "asc"}],
                "limit": 100,
            },
        )
    )
    mun_rows = rows_as_dicts(
        mcp_call(
            "query_table",
            {
                "table_name": "savivaldybes",
                "columns": [
                    "savivaldybes_kodas",
                    "savivaldybe",
                    "pavadinimas_pilnas",
                    "mokyklu_skaicius",
                    "dabartinis_mokiniu_skaicius",
                ],
                "limit": 100,
            },
        )
    )
    by_code = {}
    for row in mun_rows:
        code = row.get("savivaldybes_kodas")
        if code is None:
            continue
        by_code[int(code)] = row
    if len(index_rows) != 60 or len(by_code) != 60:
        raise MCPError(f"expected 60 municipalities, got index {len(index_rows)} and list {len(by_code)}")

    short_names = {row.get("savivaldybe") for row in mun_rows}
    funding_year, funding = latest_funding(short_names)
    exams = latest_exams()
    today = datetime.now(timezone.utc).date().isoformat()

    municipalities = []
    for row in index_rows:
        code = int(row["savivaldybes_kodas"])
        base = by_code.get(code)
        if base is None:
            print(f"  index code {code} ({row.get('savivaldybe')}) is not on the municipality list", file=sys.stderr)
            full = row.get("savivaldybe") or str(code)
            short = full
            pupils = schools = None
        else:
            full = base.get("pavadinimas_pilnas") or row.get("savivaldybe")
            short = base.get("savivaldybe") or row.get("savivaldybe")
            pupils = whole_number(base.get("dabartinis_mokiniu_skaicius"))
            schools = whole_number(base.get("mokyklu_skaicius"))
        names = english_names(full or "")
        if names is None:
            print(f"  no English name for {full!r}; using the official Lithuanian name", file=sys.stderr)
            full_en, short_en = full, short
        else:
            full_en, short_en = names
        fund = funding.get(short) if short in funding else None
        if short not in funding:
            print(f"  no funding row for {code} {short!r}", file=sys.stderr)
        rank = row.get("vieta")
        municipalities.append(
            {
                "id": str(code),
                "code": code,
                "node_id": None,
                "name": {"en": full_en, "lt": full},
                "short": {"en": short_en, "lt": short},
                "index": {
                    "score": row.get("finalinis_balas"),
                    "rank": int(rank) if isinstance(rank, int) else rank,
                    "context": row.get("sek"),
                    "parts": {
                        "strategic_leadership": row.get("strategines_lyderystes_balas"),
                        "inclusion": row.get("mokinio_itraukties_balas"),
                        "teaching_staff": row.get("pedagoginio_personalo_balas"),
                        "learning_outcomes": row.get("ugdymo_pasiekimu_balas"),
                    },
                    "weights": {
                        "strategic_leadership": row.get("strategines_lyderystes_svoris"),
                        "inclusion": row.get("mokinio_itraukties_svoris"),
                        "teaching_staff": row.get("pedagoginio_personalo_svoris"),
                        "learning_outcomes": row.get("ugdymo_pasiekimu_svoris"),
                    },
                },
                "pupils": pupils,
                "schools": schools,
                "funding_per_pupil": fund,
                "funding_school_year": funding_year if fund is not None else None,
                "exams": exams.get(code, []),
            }
        )

    municipalities.sort(key=lambda m: m["code"])
    codes = [m["code"] for m in municipalities]
    if len(codes) != 60 or len(set(codes)) != 60:
        raise MCPError(f"refusing to write a layer that is not 60 unique municipalities ({len(set(codes))})")

    folded = [m for m in municipalities if fold_name(m["name"]["lt"]) == fold_name(m["short"]["lt"])]
    print(f"Folded name agreement: {len(folded)} of {len(municipalities)} (short name and full official name).")
    if len(folded) != len(municipalities):
        for m in municipalities:
            if fold_name(m["name"]["lt"]) != fold_name(m["short"]["lt"]):
                print(f"  fold mismatch {m['code']} {m['name']['lt']!r} vs {m['short']['lt']!r}", file=sys.stderr)
        raise MCPError("a municipality short name does not fold to its official name")
    ranked = [m for m in municipalities if isinstance(m["index"].get("rank"), int) and isinstance(m["index"].get("score"), (int, float))]
    if ranked:
        best = max(m["index"]["score"] for m in ranked)
        rank1 = {m["code"] for m in ranked if m["index"]["rank"] == 1}
        tops = {m["code"] for m in ranked if m["index"]["score"] == best}
        print(f"Rank 1 codes {sorted(rank1)} have score {best}. Highest-score codes {sorted(tops)}.")
        if rank1 != tops:
            raise MCPError("rank 1 is not the highest leadership-index score")
    empty_averages = [e for m in municipalities for e in m["exams"] if e.get("average") is None]
    if empty_averages:
        raise MCPError(f"{len(empty_averages)} exam rows have no published average")
    structure = json.loads(STRUCTURE.read_text(encoding="utf-8"))
    match_nodes(municipalities, structure.get("nodes") or [])

    return {
        "schema_version": "3.1.0",
        "updated_at": today,
        "fetched_at": today,
        "id": "education",
        "name": {"en": "Municipal education", "lt": "Savivaldybių švietimas"},
        "attribution": {"en": ATTRIBUTION, "lt": ATTRIBUTION},
        "url": INDEX_URL,
        "pages": {
            "home": SITE,
            "index": INDEX_URL,
            "pupils": "https://duomenys.svietimas.lt/mokiniai/savivaldybes",
            "teachers": "https://duomenys.svietimas.lt/pedagogai/savivaldybes",
            "funding": "https://duomenys.svietimas.lt/finansavimas/savivaldybes",
            "terms": "https://duomenys.svietimas.lt/naudojimosi-salygos",
        },
        "periods": {"funding_school_year": funding_year},
        "sources": {
            "en": (
                "Leadership index (final score, rank and four category scores), current pupil and school counts, "
                "funding per pupil and exam averages are copied from the public Švietimo Duomenys tables run by "
                "VšĮ Švietimas numeris vienas. English municipality names and category labels are translations for "
                "this demo. The numbers are not recalculated. The learning-outcomes score already includes the "
                "published socioeconomic context coefficient. Funding per pupil is the publisher's "
                "finansavimas_vienam_mokiniui metric (state-school funding divided by state-school pupils) for the "
                f"latest school year with a figure ({funding_year or 'none'}). Pupil and school counts are the latest "
                "counts on the municipality list: a school is counted when it is open and has general-education pupils, "
                "and a branch is not counted as its own school. Exam averages are the latest municipal PUPP averages "
                "for Lithuanian language and mathematics. Municipal state-exam (VBE) averages are not published, so "
                "they are left out. Nothing on this layer is estimated. The map shows index scores to one decimal place, exam averages to two decimal places, and funding to the nearest euro. This file keeps the published figures."
            ),
            "lt": (
                "Lyderystės indekso galutinis balas, vieta ir keturių kategorijų balai, naujausi mokinių ir mokyklų "
                "skaičiai, finansavimas vienam mokiniui ir egzaminų vidurkiai nukopijuoti iš viešų Švietimo Duomenų "
                "lentelių, kurias tvarko VšĮ Švietimas numeris vienas. Angliški savivaldybių ir kategorijų pavadinimai "
                "yra šios demonstracijos vertimai. Skaičiai neperskaičiuoti. Ugdymo pasiekimų balas jau apima "
                "paskelbtą socialinio ir ekonominio konteksto koeficientą. Finansavimas vienam mokiniui yra "
                "duomenų leidėjo rodiklis finansavimas_vienam_mokiniui (valstybinių mokyklų finansavimas, padalytas iš "
                f"valstybinių mokyklų mokinių) už paskutinius mokslo metus, kuriems rodiklis paskelbtas ({funding_year or 'nėra'}). "
                "Mokinių ir mokyklų skaičiai yra naujausi savivaldybių sąrašo skaičiai: mokykla skaičiuojama, kai veikia "
                "ir turi bendrojo ugdymo mokinių, o padalinys neskaičiuojamas kaip atskira mokykla. Egzaminų vidurkiai "
                "yra paskutiniai paskelbti savivaldybių PUPP vidurkiai lietuvių kalbos ir matematikos. Savivaldybių "
                "valstybinių brandos egzaminų vidurkiai neskelbiami, todėl jų čia nėra. Šiame sluoksnyje "
                "niekas neįvertinta apytiksliai. Žemėlapis indekso balus rodo vienos dešimtosios tikslumu, egzaminų vidurkius dviem dešimtosiomis, o finansavimą iki artimiausio euro. Šiame faile palikti paskelbti skaičiai."
            ),
        },
        "categories": {
            "strategic_leadership": {
                "en": "Strategic leadership and management",
                "lt": "Strateginė lyderystė ir valdymas",
            },
            "inclusion": {"en": "Pupil inclusion and wellbeing", "lt": "Mokinio įtrauktis ir gerovė"},
            "teaching_staff": {"en": "Teaching staff", "lt": "Pedagoginis personalas"},
            "learning_outcomes": {"en": "Learning outcomes", "lt": "Ugdymo pasiekimai"},
        },
        "municipalities": municipalities,
    }


def main() -> int:
    try:
        layer = build()
    except (MCPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"fetch failed: {exc}", file=sys.stderr)
        return 1
    text = json.dumps(layer, ensure_ascii=False, indent=2) + "\n"
    tmp = OUT.with_suffix(".json.tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(OUT)
    filled = sum(1 for m in layer["municipalities"] if m["funding_per_pupil"] is not None)
    print(f"Wrote {OUT} ({len(layer['municipalities'])} municipalities, funding figures {filled}, fetched {layer['fetched_at']}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
