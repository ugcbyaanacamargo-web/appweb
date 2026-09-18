#!/usr/bin/env python3
from __future__ import annotations

import configparser
import json
import pathlib
import re
import subprocess
import sys
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "AGENTS.md",
    "PROJECT_STATE.md",
    "DECISIONS.md",
    "ENGINE_MANIFEST.md",
    ".gitmodules",
    "docs/RUNTIME.md",
    "docs/SKILL_ROUTER.md",
    "docs/specs/README.md",
    "docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt",
    "docs/brain/INDEX.md",
    "docs/brain/GRAPH.json",
    "docs/brain/CI.md",
    "docs/brain/DEFINITION_OF_DONE.md",
    "package.json",
    "eslint.config.js",
    "playwright.config.ts",
    "e2e/sales-flow.spec.ts",
    ".github/workflows/app-ci.yml",
    ".github/workflows/e2e.yml",
    ".github/workflows/engine-integrity.yml",
]

REQUIRED_ROUTER_TERMS = [
    "Web visual direction / design system",
    "Build or change UI",
    "Architecture / module boundaries / APIs",
    "Research / external integration",
    "Backend / central platform",
    "Semantic context / session setup",
    "Persist continuity",
    "Bug / unexpected behavior",
    "Code review / quality",
    "Security",
    "Browser / end-to-end QA",
    "Release / deploy",
]

REQUIRED_ROUTES = {
    "new_feature",
    "bug_fix",
    "integration",
    "ui_change",
    "security",
    "release",
}

REQUIRED_NODES = {
    "architecture",
    "frontend",
    "data_persistence",
    "auth_security",
    "offline_sync",
    "sales_documents",
    "api_integration",
    "testing_qa",
    "deploy_release",
}

REQUIRED_SKILLS = {"superpowers", "gstack", "ecc"}
REQUIRED_GATES = {"ci", "definition_of_done"}


def fail(message: str) -> None:
    print(f"FAIL: {message}")


def read_text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def parse_gitmodules() -> dict[str, str]:
    parser = configparser.ConfigParser()
    parser.read(ROOT / ".gitmodules", encoding="utf-8")
    result: dict[str, str] = {}
    for section in parser.sections():
        path = parser.get(section, "path", fallback="").strip()
        url = parser.get(section, "url", fallback="").strip()
        if path:
            result[path] = url
    return result


def repo_name_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "github.com":
        return None
    name = parsed.path.strip("/")
    if name.endswith(".git"):
        name = name[:-4]
    if name.count("/") != 1:
        return None
    return name


def parse_manifest() -> dict[str, str]:
    result: dict[str, str] = {}
    row = re.compile(
        r"^\|[^|]+\|\s*([^|\s]+/[^|\s]+)\s*\|[^|]*\|[^|]*\|\s*`([0-9a-f]{40})`\s*\|$"
    )
    for line in read_text("ENGINE_MANIFEST.md").splitlines():
        match = row.match(line.strip())
        if match:
            repo_name, sha = match.groups()
            result[repo_name] = sha
    return result


def gitlinks() -> dict[str, str]:
    proc = subprocess.run(
        ["git", "ls-files", "-s"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    result: dict[str, str] = {}
    for line in proc.stdout.splitlines():
        match = re.match(r"160000\s+([0-9a-f]{40})\s+\d+\t(.+)", line)
        if match:
            sha, path = match.groups()
            result[path] = sha
    return result


def require_path(path: str, context: str) -> int:
    if not (ROOT / path).is_file():
        fail(f"{context} path missing: {path}")
        return 1
    return 0


def validate_graph() -> int:
    errors = 0
    try:
        graph = json.loads(read_text("docs/brain/GRAPH.json"))
    except (json.JSONDecodeError, OSError) as exc:
        fail(f"brain graph is invalid JSON: {exc}")
        return 1

    for key in ("entry", "canonicalSpec", "state", "decisions", "skillRouter"):
        value = graph.get(key)
        if not isinstance(value, str):
            fail(f"brain graph missing string field: {key}")
            errors += 1
        else:
            errors += require_path(value, f"brain graph {key}")

    routes = graph.get("routes", {})
    nodes = graph.get("nodes", {})
    skills = graph.get("skills", {})
    gates = graph.get("gates", {})

    if set(routes) != REQUIRED_ROUTES:
        fail(f"brain routes mismatch: expected {sorted(REQUIRED_ROUTES)}, got {sorted(routes)}")
        errors += 1
    if set(nodes) != REQUIRED_NODES:
        fail(f"brain nodes mismatch: expected {sorted(REQUIRED_NODES)}, got {sorted(nodes)}")
        errors += 1
    if set(skills) != REQUIRED_SKILLS:
        fail(f"brain skills mismatch: expected {sorted(REQUIRED_SKILLS)}, got {sorted(skills)}")
        errors += 1
    if set(gates) != REQUIRED_GATES:
        fail(f"brain gates mismatch: expected {sorted(REQUIRED_GATES)}, got {sorted(gates)}")
        errors += 1

    for section_name, section in (("node", nodes), ("skill", skills), ("gate", gates)):
        for item_name, item in section.items():
            path = item.get("path") if isinstance(item, dict) else None
            if not isinstance(path, str):
                fail(f"brain {section_name} {item_name} missing path")
                errors += 1
            else:
                errors += require_path(path, f"brain {section_name} {item_name}")

    for route_name, route in routes.items():
        if not isinstance(route, dict):
            fail(f"brain route {route_name} is not an object")
            errors += 1
            continue
        path = route.get("path")
        if not isinstance(path, str):
            fail(f"brain route {route_name} missing path")
            errors += 1
        else:
            errors += require_path(path, f"brain route {route_name}")

        for node_key in route.get("requires", []) + route.get("related", []):
            if node_key not in nodes:
                fail(f"brain route {route_name} references unknown node: {node_key}")
                errors += 1
        for skill_key in route.get("skills", []):
            if skill_key not in skills:
                fail(f"brain route {route_name} references unknown skill: {skill_key}")
                errors += 1
        for gate_key in route.get("next", []):
            if gate_key not in gates:
                fail(f"brain route {route_name} references unknown gate: {gate_key}")
                errors += 1

    return errors


def validate_product_contract() -> int:
    errors = 0
    spec = read_text("docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt")
    acceptance = read_text("docs/ACCEPTANCE_MATRIX.md")

    for i in range(1, 21):
        if f"R{i}." not in spec:
            fail(f"master specification missing immutable rule R{i}")
            errors += 1

    for i in range(1, 25):
        if f"TESTE {i}:" not in spec:
            fail(f"master specification missing acceptance test {i}")
            errors += 1
        if f"| {i} |" not in acceptance:
            fail(f"acceptance matrix missing test row {i}")
            errors += 1

    if "REGRAS-MÃE IMUTÁVEIS" not in spec:
        fail("master specification missing REGRAS-MÃE IMUTÁVEIS section")
        errors += 1
    if "CRITÉRIOS DE ACEITE" not in spec:
        fail("master specification missing CRITÉRIOS DE ACEITE section")
        errors += 1

    return errors


def validate_ci_contract() -> int:
    errors = 0
    package = json.loads(read_text("package.json"))
    scripts = package.get("scripts", {})
    for script in ("lint", "test:run", "build", "test:e2e"):
        if script not in scripts:
            fail(f"package.json missing required script: {script}")
            errors += 1

    app_ci = read_text(".github/workflows/app-ci.yml")
    e2e_ci = read_text(".github/workflows/e2e.yml")
    engine_ci = read_text(".github/workflows/engine-integrity.yml")

    for command in ("npm run lint", "npm run test:run", "npm run build"):
        if command not in app_ci:
            fail(f"app-ci missing command: {command}")
            errors += 1

    if "playwright install --with-deps chromium" not in e2e_ci:
        fail("e2e workflow does not install Chromium")
        errors += 1
    if "npm run test:e2e" not in e2e_ci:
        fail("e2e workflow does not run Playwright tests")
        errors += 1
    if "python scripts/validate_engine.py" not in engine_ci:
        fail("engine-integrity workflow does not run validator")
        errors += 1

    return errors


def main() -> int:
    errors = 0

    for path in REQUIRED_FILES:
        if not (ROOT / path).is_file():
            fail(f"required file missing: {path}")
            errors += 1

    if errors:
        return 1

    router = read_text("docs/SKILL_ROUTER.md")
    agents = read_text("AGENTS.md")
    brain_index = read_text("docs/brain/INDEX.md")

    modules = parse_gitmodules()
    links = gitlinks()
    manifest = parse_manifest()

    if not links:
        fail("no git submodule gitlinks found")
        errors += 1

    if not manifest:
        fail("no repository/SHA rows parsed from ENGINE_MANIFEST.md")
        errors += 1

    module_repos: set[str] = set()

    for path, url in sorted(modules.items()):
        repo_name = repo_name_from_url(url)
        if repo_name is None:
            fail(f"submodule URL is not an approved public GitHub HTTPS URL: {path} {url}")
            errors += 1
            continue

        module_repos.add(repo_name)

        if path not in links:
            fail(f".gitmodules path is not a gitlink: {path}")
            errors += 1
            continue

        expected_sha = manifest.get(repo_name)
        if expected_sha is None:
            fail(f"submodule repository missing from ENGINE_MANIFEST.md: {repo_name}")
            errors += 1
            continue

        actual_sha = links[path]
        if actual_sha != expected_sha:
            fail(
                f"gitlink SHA mismatch for {path}: "
                f"manifest expects {expected_sha}, gitlink is {actual_sha}"
            )
            errors += 1

    for path in sorted(links):
        if path not in modules:
            fail(f"gitlink missing from .gitmodules: {path}")
            errors += 1

    manifest_repos = set(manifest)
    missing_modules = manifest_repos - module_repos
    extra_modules = module_repos - manifest_repos

    for repo_name in sorted(missing_modules):
        fail(f"manifest repository has no submodule: {repo_name}")
        errors += 1

    for repo_name in sorted(extra_modules):
        fail(f"submodule repository has no manifest row: {repo_name}")
        errors += 1

    for term in REQUIRED_ROUTER_TERMS:
        if term not in router:
            fail(f"skill router capability missing: {term}")
            errors += 1

    mandatory_agent_terms = [
        "Mandatory bootstrap",
        "Navigate the repository brain",
        "Route the task to existing skills",
        "Semantic discovery before edits",
        "Complete-functionality rule",
        "GitHub Actions is the automatic authority",
        "Browser/E2E",
        "Three-engine orchestration",
        "Persist continuity",
    ]
    for term in mandatory_agent_terms:
        if term not in agents:
            fail(f"AGENTS.md contract missing: {term}")
            errors += 1

    for term in ("Prompt Mestre", "GRAPH.json", "NEW_FEATURE", "BUG_FIX", "Definition of Done"):
        if term not in brain_index:
            fail(f"brain index missing navigation term: {term}")
            errors += 1

    if "TODO" in router or "TBD" in router:
        fail("docs/SKILL_ROUTER.md contains TODO/TBD placeholder")
        errors += 1

    errors += validate_graph()
    errors += validate_product_contract()
    errors += validate_ci_contract()

    if errors:
        print(f"Engine validation failed with {errors} error(s).")
        return 1

    print(
        "Engine validation passed: "
        f"{len(links)} pinned gitlinks matched manifest SHAs; "
        f"{len(REQUIRED_ROUTES)} routes, {len(REQUIRED_NODES)} nodes, "
        f"{len(REQUIRED_SKILLS)} engine cards and {len(REQUIRED_GATES)} gates validated; "
        "20 master rules and 24 acceptance tests traced; "
        "lint/build/unit/E2E CI contract present."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
