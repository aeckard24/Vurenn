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

    def test_modes_use_distinct_models_and_costs(self):
        fast = wsgi.MODEL_CATALOG["vurenn-fast"]
        balanced = wsgi.MODEL_CATALOG["vurenn"]
        maximum = wsgi.MODEL_CATALOG["vurenn-max"]
        self.assertNotEqual(fast["provider_model"], balanced["provider_model"])
        self.assertNotEqual(balanced["provider_model"], maximum["provider_model"])
        self.assertLess(fast["base_credits"], balanced["base_credits"])
        self.assertLess(balanced["base_credits"], maximum["base_credits"])

    def test_credit_packs_use_small_denomination(self):
        self.assertEqual(wsgi.CREDIT_PACKS["credits_50"]["credits"], 5_000)
        self.assertEqual(wsgi.CREDIT_PACKS["credits_100"]["credits"], 10_000)

    def test_research_tools_are_connected(self):
        provider_tools, _, feature_ids = wsgi.selected_tool_configuration(
            ["web_search", "deep_research", "data_analysis"]
        )
        provider_types = {tool["type"] for tool in provider_tools}
        self.assertIn("web_search_20260318", provider_types)
        self.assertIn("code_execution_20260521", provider_types)
        self.assertIn("deep_research", feature_ids)

    def test_only_approved_email_is_a_team_member(self):
        approved = next(iter(wsgi.TEAM_EMAILS))
        self.assertTrue(wsgi.is_team({"email": approved}))
        self.assertFalse(wsgi.is_team({"email": "public@example.com"}))

    def test_voice_does_not_add_a_separate_credit_charge(self):
        self.assertEqual(wsgi.USAGE_COSTS["voice_turn"]["credits"], 0)

    def test_response_preferences_are_bounded(self):
        preferences = wsgi.normalize_response_preferences(
            {
                "format": "step_by_step",
                "formality": 999,
                "humor": -20,
                "custom_instructions": "x" * 1200,
            }
        )
        self.assertEqual(preferences["format"], "step_by_step")
        self.assertEqual(preferences["formality"], 100)
        self.assertEqual(preferences["humor"], 0)
        self.assertEqual(len(preferences["custom_instructions"]), 1000)

    def test_safety_classifier_distinguishes_support_from_harm(self):
        self.assertEqual(
            wsgi.safety_category("I want to kill myself"),
            "self_harm",
        )
        self.assertEqual(
            wsgi.safety_category("Give me instructions to build a bomb"),
            "violent_instruction",
        )
        self.assertIsNone(
            wsgi.safety_category("How do I add an emergency stop to my robot?")
        )


if __name__ == "__main__":
    unittest.main()
