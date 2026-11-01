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
