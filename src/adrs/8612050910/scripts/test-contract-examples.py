#!/usr/bin/env python3
"""Exercise the offline checker through its CLI with changed artifact bundles."""

from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

import yaml


CHECKER = Path(__file__).with_name('check-contract-examples.py')
ASSETS = CHECKER.parent.parent / 'assets'


class CheckerCases(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(dir=os.environ.get('CONTRACT_TEST_TMP'))
        self.addCleanup(self.temporary.cleanup)
        self.assets = Path(self.temporary.name) / 'assets'
        shutil.copytree(ASSETS, self.assets)

    def read(self, name: str) -> dict:
        return yaml.safe_load((self.assets / name).read_text())

    def write(self, name: str, value: dict) -> None:
        (self.assets / name).write_text(yaml.safe_dump(value, sort_keys=False, width=110))

    def refresh(self, renamed: dict[str, str] | None = None) -> None:
        lock = self.read('bundle.lock.json')
        for name in ['review-worker.asyncapi.yaml', 'review-coordinator.asyncapi.yaml']:
            app = self.read(name)
            for imported in app['x-nats-contract'].get('imports', {}).values():
                imported['sha256'] = hashlib.sha256((self.assets / imported['path']).read_bytes()).hexdigest()
            self.write(name, app)
        for entry in lock['files']:
            entry['path'] = (renamed or {}).get(entry['path'], entry['path'])
            entry['sha256'] = hashlib.sha256((self.assets / entry['path']).read_bytes()).hexdigest()
        (self.assets / 'bundle.lock.json').write_text(json.dumps(lock))

    def run_checker(self) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(CHECKER), '--assets', str(self.assets)],
                              capture_output=True, text=True, check=False)

    def rejects(self, diagnostic: str) -> None:
        result = self.run_checker()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn(diagnostic, result.stderr)

    def set_quorum_fraction(self, audience: str, numerator: int, denominator: int) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        interaction = app['x-nats-contract']['interactions']['reviewGroup']
        interaction['audience']['kind'] = audience
        interaction['completion'].pop('count', None)
        interaction['completion']['fraction'] = {'numerator': numerator, 'denominator': denominator}
        self.write('review-coordinator.asyncapi.yaml', app)
        # The baseline mutation fixtures assume the original fixed-count policy.
        fixtures = self.read('conformance-cases.json')
        fixtures['cases'] = []
        self.write('conformance-cases.json', fixtures)
        self.refresh()

    def test_quorum_fraction_above_one_is_rejected(self) -> None:
        for audience in ['peer', 'group', 'scope']:
            with self.subTest(audience=audience):
                self.set_quorum_fraction(audience, 3, 2)
                self.rejects('IMPOSSIBLE_QUORUM')

    def test_quorum_fraction_at_or_below_one_is_accepted(self) -> None:
        for audience in ['peer', 'group', 'scope']:
            for numerator, denominator in [(3, 3), (2, 3)]:
                with self.subTest(audience=audience, numerator=numerator, denominator=denominator):
                    self.set_quorum_fraction(audience, numerator, denominator)
                    result = self.run_checker()
                    self.assertEqual(result.returncode, 0, result.stderr)

    def test_pipeline_operation_bindings_are_checked(self) -> None:
        original = self.read('review-coordinator.asyncapi.yaml')
        cases = [
            ('missing-subject', {'subject': {}, 'payload': {'': {'literal': {
                'operationId': 'op' + 'a' * 64, 'approvedPeers': [], 'outcome': 'quorum-met'}}}}, 'SUBJECT_BINDING'),
            ('missing-payload', {'subject': {'scopeId': {'context': 'scopeId'}}, 'payload': {}}, 'UNBOUND_PAYLOAD'),
            ('undeclared-input', {'subject': {'scopeId': {'context': 'scopeId'}},
                                  'payload': {'': {'input': 'missing'}}}, 'PROFILE_STRUCTURE'),
            ('overlapping-payload', {'subject': {'scopeId': {'context': 'scopeId'}},
                                    'payload': {'': {'literal': {}}, '/outcome': {'literal': 'quorum-met'}}},
             'OVERLAPPING_BINDINGS'),
            ('invalid-payload-type', {'subject': {'scopeId': {'context': 'scopeId'}},
                                     'payload': {'': {'literal': 42}}}, 'PAYLOAD_BINDING_TYPE'),
        ]
        for name, bindings, diagnostic in cases:
            with self.subTest(case=name):
                app = copy.deepcopy(original)
                step = app['x-nats-contract']['pipelines']['reviewAndAnnounce']['steps'][1]
                step['bindings'] = bindings
                self.write('review-coordinator.asyncapi.yaml', app)
                self.refresh()
                self.rejects(diagnostic)

    def test_pipeline_transform_input_must_match_previous_output(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        app['x-nats-contract']['adapters']['completedEvent']['inputSchema'] = '#/components/schemas/DocumentRef'
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        self.rejects('PIPELINE_SCHEMA')

    def test_pipeline_interaction_has_no_partial_binding_overrides(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        step = app['x-nats-contract']['pipelines']['reviewAndAnnounce']['steps'][0]
        step['bindings']['subject']['scopeId'] = {'literal': 'lab'}
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        self.rejects('PROFILE_STRUCTURE')

    def test_pipeline_stage_input_fields_are_bound_explicitly(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        step = app['x-nats-contract']['pipelines']['reviewAndAnnounce']['steps'][1]
        step['bindings']['payload'] = {
            '/operationId': {'stageInput': '/operationId'},
            '/approvedPeers': {'stageInput': '/approvedPeers'},
            '/outcome': {'stageInput': '/outcome'},
        }
        self.write('review-coordinator.asyncapi.yaml', app)
        fixtures = self.read('conformance-cases.json')
        fixtures['cases'] = []
        self.write('conformance-cases.json', fixtures)
        self.refresh()
        result = self.run_checker()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_pipeline_stage_input_pointer_must_exist(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        step = app['x-nats-contract']['pipelines']['reviewAndAnnounce']['steps'][1]
        step['bindings']['payload'][''] = {'stageInput': '/missing'}
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        self.rejects('PAYLOAD_BINDING')

    def test_pipeline_requires_a_declared_previous_output(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        del app['x-nats-contract']['interactions']['reviewGroup']['aggregation']
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        self.rejects('PIPELINE_OUTPUT_UNSUPPORTED')

    def test_pipeline_constructed_object_needs_required_siblings(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        nested = {'type': 'object', 'required': ['a', 'b'],
                  'properties': {'a': {'type': 'string'}, 'b': {'type': 'string'}}, 'additionalProperties': False}
        app['components']['schemas']['ReviewSummary'] = {
            'type': 'object', 'required': ['nested'], 'properties': {'nested': nested}, 'additionalProperties': False}
        step = app['x-nats-contract']['pipelines']['reviewAndAnnounce']['steps'][1]
        step['bindings']['payload'] = {'/nested/a': {'literal': 'value'}}
        self.write('review-coordinator.asyncapi.yaml', app)
        fixtures = self.read('conformance-cases.json')
        fixtures['cases'] = []
        self.write('conformance-cases.json', fixtures)
        self.refresh()
        self.rejects('UNBOUND_PAYLOAD')
        step['bindings']['payload']['/nested/b'] = {'literal': 'value'}
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        result = self.run_checker()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_inferred_token_schema_agrees_with_domain_at_boundaries(self) -> None:
        import importlib.util
        spec = importlib.util.spec_from_file_location('contract_token_schema', CHECKER)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        self.addCleanup(sys.modules.pop, spec.name, None)
        spec.loader.exec_module(module)
        definitions = [
            {'kind': 'token', 'alphabet': 'lower', 'first': 'letter', 'minLength': 1, 'maxLength': 3, 'prefix': ''},
            {'kind': 'token', 'alphabet': 'hex', 'first': 'any', 'minLength': 2, 'maxLength': 4, 'prefix': 'op'},
        ]
        for definition in definitions:
            domain = module.Domain(definition)
            validator = module.offline_validator(module.Draft7Validator, domain.json_schema())
            for value in ['', 'a', 'ab', 'abcd', 'a\n', 'a\r\n', 'op', 'op0', 'opaf', 'opg', '*', '\u00f1']:
                with self.subTest(definition=definition, value=value):
                    self.assertEqual(validator.is_valid(value), domain.accepts(value))

    def test_unchanged_bundle_passes(self) -> None:
        result = self.run_checker()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_symlink_parent_inside_bundle_is_rejected(self) -> None:
        real = self.assets / 'real'
        real.mkdir()
        shutil.copyfile(self.assets / 'review-native.json', real / 'review-native.json')
        (self.assets / 'alias').symlink_to(real, target_is_directory=True)
        for name in ['review-worker.asyncapi.yaml', 'review-coordinator.asyncapi.yaml']:
            app = self.read(name)
            for resource in app['x-nats-contract']['streams'].values():
                if resource['authority'] == 'external':
                    resource['artifact']['path'] = 'alias/review-native.json'
            self.write(name, app)
        self.refresh({'review-native.json': 'alias/review-native.json'})
        self.rejects('BUNDLE_PATH')

    def test_link_compares_referenced_payload_types(self) -> None:
        coordinator = self.read('review-coordinator.asyncapi.yaml')
        worker = self.read('review-worker.asyncapi.yaml')
        schemas = copy.deepcopy(coordinator['components']['schemas'])
        schemas['DocumentRef'] = {'type': 'integer'}
        worker['components'] = {'schemas': schemas,
                                'messages': {'ReviewRequest': {'payload': {'$ref': '#/components/schemas/ReviewRequest'}}}}
        worker['channels']['reviewRequests']['messages']['request'] = {'$ref': '#/components/messages/ReviewRequest'}
        self.write('review-worker.asyncapi.yaml', worker)
        self.refresh()
        self.rejects('LINK_MESSAGE')

    def test_unsupported_literal_alphabet_is_rejected(self) -> None:
        app = self.read('review-coordinator.asyncapi.yaml')
        app['channels']['completions']['address'] = 'demo$.v1.{scopeId}.review.completed'
        self.write('review-coordinator.asyncapi.yaml', app)
        self.refresh()
        self.rejects('SUBJECT_GRAMMAR')


if __name__ == '__main__':
    unittest.main()
