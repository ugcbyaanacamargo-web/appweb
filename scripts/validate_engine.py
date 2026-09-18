#!/usr/bin/env python3
from __future__ import annotations

import configparser
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
]

REQUIRED_ROUTER_TERMS = [
    "Web visual direction / design system",
    "Build or change UI",
    "Architecture / module boundaries / APIs",
    "Semantic context / session setup",
    "Persist continuity",
    "Bug / unexpected behavior",
    "Code review / quality",
    "Security",
    "Browser / end-to-end QA",
    "Release / deploy",
]


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
        "Restore project context first",
        "Route the task to existing skills",
        "Semantic discovery before edits",
        "Review and verification before merge",
        "Persist continuity after meaningful work",
    ]
    for term in mandatory_agent_terms:
        if term not in agents:
            fail(f"AGENTS.md contract missing: {term}")
            errors += 1

    if "TODO" in router or "TBD" in router:
        fail("docs/SKILL_ROUTER.md contains TODO/TBD placeholder")
        errors += 1

    if errors:
        print(f"Engine validation failed with {errors} error(s).")
        return 1

    print(
        "Engine validation passed: "
        f"{len(links)} pinned gitlinks matched to exact manifest repositories/SHAs, "
        f"{len(REQUIRED_ROUTER_TERMS)} routed capability groups, "
        "continuity contract present."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
