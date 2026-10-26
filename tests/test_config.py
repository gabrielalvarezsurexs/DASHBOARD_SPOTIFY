from pipeline import config


def test_raw_users_match_data_folders():
    users = config.raw_users()
    assert all(u == u.lower() and " " not in u for u in users), (
        "Las carpetas de data/raw/ deben ir en minúsculas y sin espacios (son el user_id)"
    )
