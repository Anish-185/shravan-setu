# config/

`screening.json`: every threshold and rule parameter, read by both rule engines and by `scripts/make_tones.py`.
Single source of truth: no magic numbers in code.

Every value is `{"value": ..., "source": ...}`. `source` is a citation, a script, a design choice, or
`PLACEHOLDER` / `TODO(source)` when there is no evidence yet. Levels are "dB re: team baseline", never dB HL.
`server/referrals/tests/test_rules_fixtures.py` checks that every value has a source.

When you change a value, bump `config_version`. The rule fixtures use their own frozen copy
(`shared/fixtures/fixture_config.json`), so tuning this file does not break them.
