import unittest

import wsgi


class SecurityAndMeteringTests(unittest.TestCase):
    def test_provider_identity_and_credentials_are_sanitized(self):
        value = wsgi.sanitize_assistant_text(
            "I am Claude from Anthropic. sk_test_abcdefghijklmnop"
        )
        self.assertNotIn("Claude", value)
        self.assertNotIn("Anthropic", value)
        self.assertIn("Vurenn", value)
        self.assertIn("[private credential]", value)

    def test_credit_cost_increases_with_usage(self):
        model = wsgi.MODEL_CATALOG["vurenn-max"]
        small = wsgi.credits_for_usage(model, 1_000, 500)
        large = wsgi.credits_for_usage(model, 1_000_000, 50_000)
        self.assertGreater(large, small)
        self.assertGreaterEqual(small, model["base_credits"])

    def test_only_approved_email_is_a_team_member(self):
        approved = next(iter(wsgi.TEAM_EMAILS))
        self.assertTrue(wsgi.is_team({"email": approved}))
        self.assertFalse(wsgi.is_team({"email": "public@example.com"}))


if __name__ == "__main__":
    unittest.main()
