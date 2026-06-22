from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def analyze(text: str) -> dict:
    response = client.post("/analyze", json={"text": text})
    response.raise_for_status()
    return response.json()


def assert_has_metadata(result: dict) -> None:
    assert result["prediction_source"] in {"RULE_BASED", "ZERO_SHOT"}
    assert 0.0 <= float(result["confidence_score"]) <= 1.0
    assert result["sentiment"] in {"POSITIVE", "NEGATIVE", "NEUTRAL"}
    assert result["impact"] in {"NONE", "SINGLE_USER", "MULTIPLE_USERS", "BUSINESS_BLOCKING", "SYSTEM_OUTAGE"}
    assert isinstance(result["urgency_signals"], list)
    assert result["impact_reason"]
    assert result["model_version"] == "hybrid-v2.1"


def test_urgent_server_down() -> None:
    result = analyze("Production server down, this is urgent and all users cannot work.")

    assert result["category"] in {"INFRASTRUCTURE", "GENERAL"}
    assert result["priority"] == "URGENT"
    assert result["impact"] == "SYSTEM_OUTAGE"
    assert result["urgency_signals"]
    assert_has_metadata(result)


def test_account_login_issue() -> None:
    result = analyze("Can you help me reset my password? I cannot login to my account.")

    assert result["category"] == "ACCOUNT"
    assert result["priority"] in {"LOW", "MEDIUM", "HIGH", "URGENT"}
    assert result["impact"] == "SINGLE_USER"
    assert_has_metadata(result)


def test_network_issue() -> None:
    result = analyze("The office wifi is slow and the VPN connection keeps dropping.")

    assert result["category"] == "NETWORK"
    assert result["priority"] in {"MEDIUM", "HIGH", "URGENT"}
    assert result["impact"] in {"NONE", "MULTIPLE_USERS"}
    assert_has_metadata(result)


def test_ticket_summary_structure() -> None:
    response = client.post(
        "/summarize-ticket",
        json={
            "title": "VPN cannot connect",
            "description": "The VPN fails after password reset.",
            "category": "NETWORK",
            "priority": "HIGH",
            "comments": [{"content": "User already restarted the laptop."}],
        },
    )
    response.raise_for_status()
    result = response.json()

    assert result["summary"]
    assert result["customer_problem"]
    assert isinstance(result["attempted_steps"], list)
    assert isinstance(result["suggested_next_steps"], list)
    assert result["suggested_reply"]
    assert result["source"] == "RULE_BASED"


if __name__ == "__main__":
    for test in (test_urgent_server_down, test_account_login_issue, test_network_issue, test_ticket_summary_structure):
        test()
        print(f"{test.__name__}: passed")
