from conftest import auth_headers

ADMIN_A = auth_headers("admin_org_a")
MEMBER_A = auth_headers("member_org_a")
ADMIN_B = auth_headers("admin_org_b")


def make_category(client, name, parent_id=None, headers=ADMIN_A):
    resp = client.post("/api/categories", json={"name": name, "parent_id": parent_id}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def make_asset(client, name, category_id=None, headers=ADMIN_A):
    resp = client.post("/api/assets", json={"name": name, "category_id": category_id}, headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()


def asset_names(resp):
    assert resp.status_code == 200, resp.text
    return sorted(a["name"] for a in resp.json())


# --- Permissions and org isolation -----------------------------------------

def test_member_can_list_but_not_change_categories(client):
    cat = make_category(client, "Cameras")

    resp = client.get("/api/categories", headers=MEMBER_A)
    assert resp.status_code == 200
    assert [c["name"] for c in resp.json()] == ["Cameras"]

    assert client.post("/api/categories", json={"name": "Audio"}, headers=MEMBER_A).status_code == 403
    assert client.put(f"/api/categories/{cat['id']}", json={"name": "X"}, headers=MEMBER_A).status_code == 403
    assert client.delete(f"/api/categories/{cat['id']}", headers=MEMBER_A).status_code == 403
    assert client.post("/api/categories/suggested", headers=MEMBER_A).status_code == 403


def test_unauthenticated_requests_are_refused(client):
    assert client.get("/api/categories").status_code == 403


def test_teams_only_see_and_touch_their_own_categories(client):
    cat = make_category(client, "Cameras")

    assert client.get("/api/categories", headers=ADMIN_B).json() == []
    assert client.put(f"/api/categories/{cat['id']}", json={"name": "Mine"}, headers=ADMIN_B).status_code == 404
    assert client.delete(f"/api/categories/{cat['id']}", headers=ADMIN_B).status_code == 404
    # Nor can another team hang a subcategory off it.
    resp = client.post("/api/categories", json={"name": "Sneaky", "parent_id": cat["id"]}, headers=ADMIN_B)
    assert resp.status_code == 404


def test_same_name_is_fine_in_different_teams(client):
    make_category(client, "Cameras")
    make_category(client, "Cameras", headers=ADMIN_B)


def test_cannot_give_an_asset_another_teams_category(client):
    other = make_category(client, "Theirs", headers=ADMIN_B)

    resp = client.post("/api/assets", json={"name": "Cam", "category_id": other["id"]}, headers=ADMIN_A)
    assert resp.status_code == 400

    asset = make_asset(client, "Cam")
    resp = client.put(f"/api/assets/{asset['id']}", json={"category_id": other["id"]}, headers=ADMIN_A)
    assert resp.status_code == 400
    assert client.get(f"/api/assets/{asset['id']}", headers=ADMIN_A).json()["category_id"] is None


# --- Names and levels -------------------------------------------------------

def test_duplicate_names_are_rejected_ignoring_case_and_spaces(client):
    cameras = make_category(client, "Cameras")
    resp = client.post("/api/categories", json={"name": "  cameras "}, headers=ADMIN_A)
    assert resp.status_code == 409

    # The same name is fine under a different parent.
    make_category(client, "Accessories", parent_id=cameras["id"])
    audio = make_category(client, "Audio")
    make_category(client, "Accessories", parent_id=audio["id"])
    resp = client.post("/api/categories", json={"name": "ACCESSORIES", "parent_id": audio["id"]}, headers=ADMIN_A)
    assert resp.status_code == 409


def test_names_are_trimmed_and_must_not_be_blank(client):
    assert make_category(client, "  Cinema   lenses ")["name"] == "Cinema lenses"
    assert client.post("/api/categories", json={"name": "   "}, headers=ADMIN_A).status_code == 422
    assert client.post("/api/categories", json={"name": "x" * 61}, headers=ADMIN_A).status_code == 422


def test_only_two_levels(client):
    cameras = make_category(client, "Cameras")
    bodies = make_category(client, "Bodies", parent_id=cameras["id"])

    resp = client.post("/api/categories", json={"name": "Too deep", "parent_id": bodies["id"]}, headers=ADMIN_A)
    assert resp.status_code == 400

    # A category with subcategories can't be moved under another one.
    audio = make_category(client, "Audio")
    resp = client.put(f"/api/categories/{cameras['id']}", json={"parent_id": audio["id"]}, headers=ADMIN_A)
    assert resp.status_code == 400

    # Nor can a category be put inside itself.
    resp = client.put(f"/api/categories/{audio['id']}", json={"parent_id": audio["id"]}, headers=ADMIN_A)
    assert resp.status_code == 400


def test_rename_and_move(client):
    cameras = make_category(client, "Cameras")
    lenses = make_category(client, "Lenses")

    resp = client.put(f"/api/categories/{lenses['id']}", json={"name": "Glass", "parent_id": cameras["id"]}, headers=ADMIN_A)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Glass"
    assert resp.json()["parent_id"] == cameras["id"]

    # Renaming alone leaves it where it is.
    resp = client.put(f"/api/categories/{lenses['id']}", json={"name": "Lenses"}, headers=ADMIN_A)
    assert resp.json()["parent_id"] == cameras["id"]

    # parent_id null moves it back to the top level.
    resp = client.put(f"/api/categories/{lenses['id']}", json={"parent_id": None}, headers=ADMIN_A)
    assert resp.json()["parent_id"] is None

    # Renaming onto an existing sibling's name is refused.
    resp = client.put(f"/api/categories/{lenses['id']}", json={"name": "cameras"}, headers=ADMIN_A)
    assert resp.status_code == 409


def test_list_is_a_tree_with_asset_counts(client):
    cameras = make_category(client, "Cameras")
    bodies = make_category(client, "Bodies", parent_id=cameras["id"])
    make_category(client, "Audio")
    make_asset(client, "FX6", bodies["id"])
    make_asset(client, "FX3", bodies["id"])
    make_asset(client, "Spare cage", cameras["id"])

    tree = client.get("/api/categories", headers=ADMIN_A).json()
    assert [c["name"] for c in tree] == ["Audio", "Cameras"]
    cams = tree[1]
    assert cams["asset_count"] == 1
    assert [(s["name"], s["asset_count"]) for s in cams["subcategories"]] == [("Bodies", 2)]


# --- Suggested list ---------------------------------------------------------

def test_suggested_categories_skip_existing_names(client):
    make_category(client, "lenses")

    tree = client.post("/api/categories/suggested", headers=ADMIN_A).json()
    names = [c["name"] for c in tree]
    assert names.count("lenses") == 1 and "Lenses" not in names
    assert {"Cameras", "Audio", "Lighting", "Grip", "Cables & Power", "IT"} <= set(names)

    # Running it again adds nothing.
    again = client.post("/api/categories/suggested", headers=ADMIN_A).json()
    assert len(again) == len(tree)


def test_nothing_is_created_until_someone_asks(client):
    assert client.get("/api/categories", headers=ADMIN_A).json() == []


# --- Filtering assets -------------------------------------------------------

def test_filter_by_category_includes_subcategories(client):
    cameras = make_category(client, "Cameras")
    bodies = make_category(client, "Bodies", parent_id=cameras["id"])
    audio = make_category(client, "Audio")
    make_asset(client, "FX6", bodies["id"])
    make_asset(client, "Cage", cameras["id"])
    make_asset(client, "Mic", audio["id"])
    make_asset(client, "Loose cable")

    assert asset_names(client.get(f"/api/assets?category_id={cameras['id']}", headers=MEMBER_A)) == ["Cage", "FX6"]
    assert asset_names(client.get(f"/api/assets?category_id={bodies['id']}", headers=MEMBER_A)) == ["FX6"]
    assert asset_names(client.get("/api/assets?category_id=none", headers=MEMBER_A)) == ["Loose cable"]
    assert asset_names(client.get("/api/assets?category_id=", headers=MEMBER_A)) == ["Cage", "FX6", "Loose cable", "Mic"]
    assert client.get("/api/assets?category_id=abc", headers=MEMBER_A).status_code == 422


def test_filter_never_crosses_teams(client):
    theirs = make_category(client, "Cameras", headers=ADMIN_B)
    make_asset(client, "Their cam", theirs["id"], headers=ADMIN_B)
    assert asset_names(client.get(f"/api/assets?category_id={theirs['id']}", headers=ADMIN_A)) == []


# --- Changing and deleting --------------------------------------------------

def test_changing_category_is_logged_with_names(client):
    lenses = make_category(client, "Lenses")
    cinema = make_category(client, "Cinema lenses")
    asset = make_asset(client, "24-70", lenses["id"])

    resp = client.put(f"/api/assets/{asset['id']}", json={"category_id": cinema["id"]}, headers=ADMIN_A)
    assert resp.status_code == 200 and resp.json()["category_id"] == cinema["id"]
    # Clearing it works too.
    resp = client.put(f"/api/assets/{asset['id']}", json={"category_id": None}, headers=ADMIN_A)
    assert resp.json()["category_id"] is None

    logs = client.get("/api/activity", headers=ADMIN_A).json()
    changes = [l["details"] for l in logs if l["event_type"] == "category_changed"]
    assert {"previous_category": "Lenses", "new_category": "Cinema lenses"} in changes
    assert {"previous_category": "Cinema lenses", "new_category": None} in changes


def test_saving_without_changing_category_logs_no_category_change(client):
    lenses = make_category(client, "Lenses")
    asset = make_asset(client, "24-70", lenses["id"])
    client.put(f"/api/assets/{asset['id']}", json={"name": "24-70 GM", "category_id": lenses["id"]}, headers=ADMIN_A)
    logs = client.get("/api/activity", headers=ADMIN_A).json()
    assert not [l for l in logs if l["event_type"] == "category_changed"]


def test_deleting_a_category_uncategorizes_its_assets(client):
    lenses = make_category(client, "Lenses")
    a = make_asset(client, "24-70", lenses["id"])
    b = make_asset(client, "50mm", lenses["id"])

    resp = client.delete(f"/api/categories/{lenses['id']}", headers=ADMIN_A)
    assert resp.status_code == 200
    assert resp.json()["uncategorized_assets"] == 2

    for asset in (a, b):
        assert client.get(f"/api/assets/{asset['id']}", headers=ADMIN_A).json()["category_id"] is None
    assert client.get("/api/categories", headers=ADMIN_A).json() == []

    logs = client.get("/api/activity", headers=ADMIN_A).json()
    deleted = [l for l in logs if l["event_type"] == "category_changed"]
    assert len(deleted) == 2
    assert all(l["details"]["reason"] == "category_deleted" for l in deleted)


def test_cannot_delete_a_category_that_has_subcategories(client):
    cameras = make_category(client, "Cameras")
    bodies = make_category(client, "Bodies", parent_id=cameras["id"])

    assert client.delete(f"/api/categories/{cameras['id']}", headers=ADMIN_A).status_code == 409
    assert client.delete(f"/api/categories/{bodies['id']}", headers=ADMIN_A).status_code == 200
    assert client.delete(f"/api/categories/{cameras['id']}", headers=ADMIN_A).status_code == 200
