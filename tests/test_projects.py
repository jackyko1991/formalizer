"""Research projects on disk: working copy, the one saved version, restore by swapping, and the guards."""

import pytest
from fastapi.testclient import TestClient

from tests.test_runner import REPL, client  # noqa: F401 (the shared runner fixture)


@pytest.fixture
def api(tmp_path, monkeypatch):
    monkeypatch.setenv("FORMALIZER_PROJECTS", str(tmp_path))
    from backend.app import app

    return TestClient(app), tmp_path


def files(*pairs):
    return [{"name": n, "code": c} for n, c in pairs]


def test_working_copy_saved_version_and_restore(api):
    c, root = api
    body = {
        "files": files(("Lemmas.lean", "theorem a : True := trivial\n"), ("Main.lean", "theorem m : True := a\n")),
        "meta": {"title": "T"},
    }
    assert c.put("/api/projects/demo", json=body).status_code == 200
    assert (root / "demo" / "Main.lean").read_text() == "theorem m : True := a\n"
    got = c.get("/api/projects/demo").json()
    assert [f["name"] for f in got["files"]] == ["Lemmas.lean", "Main.lean"] and got["saved"] is None
    assert (
        c.post("/api/projects/demo/save", json={"label": "first", "summary": {"proved": 2}}).json()["label"] == "first"
    )
    # keep working: one file changes, one is deleted
    c.put(
        "/api/projects/demo",
        json={"files": files(("Main.lean", "theorem m : True := by\n  sorry\n")), "meta": {"title": "T"}},
    )
    assert not (root / "demo" / "Lemmas.lean").exists()
    assert [f["name"] for f in c.get("/api/projects/demo/saved").json()["files"]] == ["Lemmas.lean", "Main.lean"]
    # restore swaps: the old work comes back, and what was current is now the saved version
    out = c.post("/api/projects/demo/restore").json()
    assert out["restored"]["label"] == "first" and out["saved"]["label"] == "before restore"
    assert (root / "demo" / "Lemmas.lean").exists()
    assert "sorry" in c.get("/api/projects/demo/saved").json()["files"][0]["code"]
    c.post("/api/projects/demo/restore")  # and back again
    assert not (root / "demo" / "Lemmas.lean").exists()
    assert [p["id"] for p in c.get("/api/projects").json()] == ["demo"]


def test_guards(api):
    c, root = api
    assert c.put("/api/projects/Bad..id", json={"files": [], "meta": {}}).status_code in (404, 422)
    assert c.put("/api/projects/x", json={"files": files(("../evil.lean", "")), "meta": {}}).status_code == 422
    assert (
        c.put("/api/projects/x", json={"files": files(("A.lean", ""), ("A.lean", "")), "meta": {}}).status_code == 422
    )
    assert c.get("/api/projects", headers={"origin": "https://evil.example"}).status_code == 403
    assert c.get("/api/projects", headers={"origin": "http://localhost:5181"}).status_code == 200
    assert not (root.parent / "evil.lean").exists()


def test_decl_status_through_check(client):  # noqa: F811
    code = (
        "def sumTo : Nat → Nat\n  | 0 => 0\n  | n + 1 => sumTo n + (n + 1)\n"
        "theorem done (n : Nat) : sumTo (n + 1) = sumTo n + (n + 1) := rfl\n"
        "theorem open_one (n : Nat) : n + 0 = n := by\n  sorry\n"
        "theorem uses_open (n : Nat) : n + 0 + 0 = n := (open_one (n + 0)).trans (open_one n)\n"
        "theorem broken : 1 = 2 := by\n  decide\n"
    )
    r = client.post("/api/check", json={"code": code, "decls": True}).json()
    status = {d["name"]: d["status"] for d in r["decls"]}
    assert status == {"sumTo": "def", "done": "proved", "open_one": "sorry", "uses_open": "depends", "broken": "error"}
    uses = {d["name"]: d["uses"] for d in r["decls"]}
    assert uses["uses_open"] == ["open_one"] and uses["done"] == ["sumTo"]
    assert "decls" not in client.post("/api/check", json={"code": code}).json()
