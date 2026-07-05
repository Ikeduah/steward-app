from app.routers.assets import claims_is_admin


def test_standard_org_role_admin():
    assert claims_is_admin({"org_role": "org:admin"}) is True


def test_minified_admin_role():
    assert claims_is_admin({"o": {"rol": "admin"}}) is True


def test_non_admin_role():
    assert claims_is_admin({"org_role": "member"}) is False
    assert claims_is_admin({"o": {"rol": "basic_member"}}) is False


def test_empty_claims():
    assert claims_is_admin({}) is False
