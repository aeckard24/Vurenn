import unittest
from datetime import datetime, timezone

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

    def test_tools_are_inferred_from_natural_requests(self):
        self.assertEqual(
            wsgi.infer_requested_tools("Please search the web for current information"),
            ["web_search"],
        )
        self.assertEqual(
            wsgi.infer_requested_tools("Deep research this market for me"),
            ["deep_research"],
        )
        self.assertEqual(
            wsgi.infer_requested_tools("Explain this", has_attachments=True),
            ["file_analysis"],
        )

    def test_only_approved_email_is_a_team_member(self):
        approved = next(iter(wsgi.TEAM_EMAILS))
        self.assertTrue(wsgi.is_team({"email": approved}))
        self.assertFalse(wsgi.is_team({"email": "public@example.com"}))

    def test_voice_does_not_add_a_separate_credit_charge(self):
        self.assertEqual(wsgi.USAGE_COSTS["voice_turn"]["credits"], 0)

    def test_voice_text_removes_emoji_and_markdown(self):
        self.assertEqual(
            wsgi.sanitize_voice_text("**Great** 😊 Let’s go 🚀"),
            "Great  Let’s go ",
        )
        self.assertEqual(
            wsgi.clean_spoken_text("Hello 👋 **No emoji aloud.**"),
            "Hello No emoji aloud.",
        )

    def test_local_arithmetic_uses_restricted_evaluator(self):
        self.assertEqual(
            wsgi.local_utility_response("calculate 2 + 2"),
            "The answer is 4.",
        )
        self.assertEqual(
            wsgi.local_utility_response("what is 12 squared"),
            "The answer is 144.",
        )
        with self.assertRaises(ValueError):
            wsgi.safe_calculate("__import__('os').system('whoami')")

    def test_local_square_root_and_time_responses(self):
        self.assertEqual(
            wsgi.local_utility_response("square root of 144"),
            "The square root of 144 is 12.",
        )
        response = wsgi.local_utility_response(
            "what time is it",
            now=datetime(2026, 7, 29, 15, 4, tzinfo=timezone.utc),
        )
        self.assertEqual(response, "The current UTC time is 15:04 UTC.")

    def test_local_youtube_search_encodes_the_query(self):
        self.assertEqual(
            wsgi.local_utility_response("search YouTube for jazz & blues"),
            (
                "Here’s a YouTube search for that: "
                "https://www.youtube.com/results?search_query=jazz+%26+blues"
            ),
        )

    def test_local_response_has_a_lower_minimum_cost(self):
        self.assertLess(
            wsgi.LOCAL_RESPONSE_CREDITS,
            wsgi.MODEL_CATALOG["vurenn-fast"]["base_credits"],
        )
        self.assertEqual(
            wsgi.credits_for_usage(
                wsgi.MODEL_CATALOG["vurenn"],
                0,
                0,
                minimum_credits=wsgi.LOCAL_RESPONSE_CREDITS,
            ),
            wsgi.LOCAL_RESPONSE_CREDITS,
        )

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

    def test_response_preferences_accept_only_supported_voices(self):
        selected = wsgi.normalize_response_preferences(
            {"voice_id": "am_michael"}
        )
        invalid = wsgi.normalize_response_preferences(
            {"voice_id": "not-a-real-voice"}
        )
        self.assertEqual(selected["voice_id"], "am_michael")
        self.assertEqual(invalid["voice_id"], "af_heart")

    def test_appearance_preferences_are_allowlisted(self):
        preferences = wsgi.normalize_response_preferences(
            {
                "appearance": {
                    "color_theme": "aurora",
                    "accent": "rose",
                    "gradient": "sunset",
                    "atmosphere": "mesh",
                    "bubble": "soft",
                    "font_size": "large",
                }
            }
        )
        self.assertEqual(preferences["appearance"]["accent"], "rose")
        self.assertEqual(preferences["appearance"]["color_theme"], "aurora")
        self.assertEqual(preferences["appearance"]["gradient"], "sunset")
        invalid = wsgi.normalize_response_preferences(
            {"appearance": {"accent": "javascript:red", "gradient": "url"}}
        )
        self.assertEqual(invalid["appearance"]["accent"], "blue")
        self.assertEqual(invalid["appearance"]["gradient"], "solid")

    def test_journal_content_is_bounded(self):
        content = wsgi.normalize_journal_content(
            {
                "intro": "x" * 1000,
                "updates": [
                    {
                        "date": "Today",
                        "category": "Product",
                        "title": "A real update",
                        "summary": "Useful news",
                    }
                ],
                "team": [{"name": "Kendric", "role": "Founding team", "note": ""}],
            }
        )
        self.assertEqual(len(content["intro"]), 600)
        self.assertEqual(content["updates"][0]["title"], "A real update")
        self.assertEqual(content["team"][0]["name"], "Kendric")

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
