#!/usr/bin/env python3
"""Offline conformance checks for the draft ADR examples, without broker execution."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import re
import string
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft7Validator, Draft202012Validator
from referencing import Registry, Resource
from referencing.exceptions import NoSuchResource
from referencing.jsonschema import DRAFT7, DRAFT202012


CONTEXT_FIELDS = {
    "contractId", "contractVersion", "contractDigest", "operationId", "principalId",
    "senderPeerId", "scopeId", "systemId", "accountId", "jetstreamDomain", "nowMs",
    "deadlineMs", "policyRevision",
}
BRANCH_FIELDS = {"id", "peerId", "attempt", "fence", "input"}
BASE_ALPHABET = set(string.ascii_letters + string.digits + "_-")
DEFAULT_FILES = [
    "review-coordinator.asyncapi.yaml", "review-worker.asyncapi.yaml",
    "nats-contract-profile.schema.json", "adapter-contracts.schema.json", "review-native.json",
]


def offline_validator(validator_class, schema: dict):
    def refuse_network(uri: str):
        raise NoSuchResource(ref=uri)
    specification = DRAFT202012 if validator_class is Draft202012Validator else DRAFT7
    registry = Registry(retrieve=refuse_network).with_resource(
        schema.get("$id", "urn:local:contract-validation"),
        Resource.from_contents(schema, default_specification=specification),
    ).crawl()
    return validator_class(schema, registry=registry)


class Diagnostic(Exception):
    def __init__(self, code: str, detail: str):
        super().__init__(f"{code}: {detail}")
        self.code = code


def require(condition: bool, code: str, detail: str) -> None:
    if not condition:
        raise Diagnostic(code, detail)


class UniqueLoader(yaml.SafeLoader):
    pass


def unique_mapping(loader: UniqueLoader, node: Any, deep: bool = False) -> dict:
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        require(key not in result, "DUPLICATE_KEY", str(key))
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def load_document(path: Path) -> Any:
    return yaml.load(path.read_text(), Loader=UniqueLoader)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pointer(value: Any, reference: str) -> Any:
    require(reference.startswith("#/") or reference == "", "INVALID_POINTER", reference)
    if reference == "":
        return value
    for key in reference[2:].split("/"):
        key = key.replace("~1", "/").replace("~0", "~")
        try:
            value = value[int(key)] if isinstance(value, list) else value[key]
        except (KeyError, IndexError, ValueError, TypeError) as error:
            raise Diagnostic("REFERENCE_NOT_FOUND", reference) from error
    return value


def safe_path(root: Path, name: str) -> Path:
    require(
        bool(name) and not name.startswith("/") and "\\" not in name
        and all(part not in {"", ".", ".."} for part in name.split("/")),
        "BUNDLE_PATH", name,
    )
    candidate = root / name
    cursor = root
    for part in name.split("/"):
        cursor = cursor / part
        require(not cursor.is_symlink(), "BUNDLE_PATH", name)
    require(candidate.resolve().is_relative_to(root.resolve()), "BUNDLE_PATH", name)
    return candidate


@dataclass(frozen=True)
class Domain:
    definition: dict

    @property
    def alphabet(self) -> set[str]:
        alphabet = self.definition.get("alphabet")
        if alphabet == "hex":
            return set(string.digits + "abcdef")
        letters = string.ascii_lowercase if alphabet == "lower" else string.ascii_letters
        return set(letters + string.digits + "_-")

    def accepts(self, value: Any) -> bool:
        if not isinstance(value, str) or not value or not set(value) <= BASE_ALPHABET:
            return False
        if self.definition["kind"] == "enum":
            return value in self.definition["values"]
        spec = self.definition
        return (
            spec["minLength"] <= len(value) <= spec["maxLength"]
            and value.startswith(spec["prefix"])
            and set(value[len(spec["prefix"]):]) <= self.alphabet
            and (spec["first"] == "any" or (len(value) > len(spec["prefix"])
                 and value[len(spec["prefix"])] in self.alphabet & set(string.ascii_letters)))
        )

    def positions(self, length: int) -> list[set[str]] | None:
        spec = self.definition
        if spec["kind"] != "token":
            return None
        prefix = spec["prefix"]
        if not (spec["minLength"] <= length <= spec["maxLength"]) or len(prefix) > length:
            return None
        positions = [{prefix[index]} if index < len(prefix) else self.alphabet for index in range(length)]
        if spec["first"] == "letter":
            if length == len(prefix):
                return None
            positions[len(prefix)] &= set(string.ascii_letters)
        return positions if all(positions) else None

    def intersects(self, other: Domain) -> bool:
        if self.definition["kind"] == "enum":
            return any(other.accepts(value) for value in self.definition["values"])
        if other.definition["kind"] == "enum":
            return other.intersects(self)
        for length in range(1, 129):
            left, right = self.positions(length), other.positions(length)
            if left and right and all(a & b for a, b in zip(left, right)):
                return True
        return False

    def equals(self, other: Domain) -> bool:
        if self.definition["kind"] == "enum":
            values = set(self.definition["values"])
            if other.definition["kind"] == "enum":
                return values == set(other.definition["values"])
            if not all(other.accepts(value) for value in values):
                return False
            count = sum(math.prod(len(chars) for chars in positions)
                        for length in range(1, 129) if (positions := other.positions(length)))
            return count == len(values)
        if other.definition["kind"] == "enum":
            return other.equals(self)
        return all(self.positions(length) == other.positions(length) for length in range(1, 129))


def literal_domain(value: str) -> Domain:
    return Domain({"kind": "enum", "values": [value]})


class Bundle:
    def __init__(self, root: Path, documents: dict[str, Any], profile_schema: dict):
        self.root = root
        self.documents = documents
        self.profile_schema = profile_schema

    def resolve(self, filename: str, reference: str) -> tuple[str, Any]:
        path, separator, fragment = reference.partition("#")
        require(":" not in path, "NETWORK_REFERENCE", reference)
        target = str((Path(filename).parent / path).as_posix()) if path else filename
        safe_path(self.root, target)
        require(target in self.documents, "UNLOCKED_REFERENCE", target)
        return target, pointer(self.documents[target], "#" + fragment if separator else "")

    def dereference(self, filename: str, value: Any, seen: set[tuple[str, str]] | None = None) -> tuple[str, Any]:
        seen = set() if seen is None else seen
        while isinstance(value, dict) and "$ref" in value:
            identity = (filename, value["$ref"])
            require(identity not in seen, "REFERENCE_CYCLE", str(identity))
            seen.add(identity)
            filename, value = self.resolve(filename, value["$ref"])
        return filename, value

    def app(self, filename: str) -> dict:
        require(filename in self.documents, "REFERENCE_NOT_FOUND", filename)
        return self.documents[filename]

    def schema_value(self, filename: str, value: Any, seen: set | None = None) -> Any:
        seen = set() if seen is None else seen
        if isinstance(value, dict):
            if isinstance(value.get("$ref"), str):
                identity = (filename, value["$ref"])
                require(identity not in seen, "LINK_MESSAGE", "Recursive payload comparison is unsupported")
                target_file, target = self.resolve(filename, value["$ref"])
                return self.schema_value(target_file, target, seen | {identity})
            return {key: self.schema_value(filename, child, seen) for key, child in value.items()}
        if isinstance(value, list):
            return [self.schema_value(filename, child, seen) for child in value]
        return value

    def operation(self, filename: str, reference: Any) -> tuple[str, str, dict]:
        if isinstance(reference, dict):
            alias = reference["contract"]
            imports = self.app(filename)["x-nats-contract"].get("imports", {})
            require(alias in imports, "REFERENCE_NOT_FOUND", alias)
            filename = imports[alias]["path"]
            reference = reference["operation"]
        app = self.app(filename)
        require(reference in app.get("operations", {}), "REFERENCE_NOT_FOUND", str(reference))
        return filename, reference, app["operations"][reference]

    def channel_id(self, operation: dict) -> str:
        reference = operation["channel"]["$ref"]
        require(reference.startswith("#/channels/"), "CHANNEL_REFERENCE", reference)
        return reference.removeprefix("#/channels/")

    def tokens(self, filename: str, channel_id: str) -> list[Domain] | None:
        app = self.app(filename)
        channel = app["channels"][channel_id]
        address = channel.get("address")
        if address is None:
            return None
        require(bool(address) and all(address.split(".")), "SUBJECT_GRAMMAR", channel_id)
        profile = app["x-nats-contract"]
        parameters = profile["channels"].get(channel_id, {}).get("parameters", {})
        result = []
        used = set()
        for token in address.split("."):
            match = re.fullmatch(r"[{]([^{}]+)[}]", token)
            if match:
                name = match.group(1)
                require(name in parameters, "PARAMETER_MAPPING", name)
                require(parameters[name] in profile["tokenTypes"], "TOKEN_TYPE", parameters[name])
                result.append(Domain(profile["tokenTypes"][parameters[name]]))
                used.add(name)
            else:
                require(set(token) <= BASE_ALPHABET,
                        "SUBJECT_GRAMMAR", channel_id)
                result.append(literal_domain(token))
        require(used == set(parameters) == set(channel.get("parameters", {})), "PARAMETER_MAPPING", channel_id)
        return result

    def render(self, filename: str, channel_id: str, values: dict) -> str:
        app = self.app(filename)
        mapping = app["x-nats-contract"]["channels"][channel_id]["parameters"]
        require(set(values) == set(mapping), "PARAMETER_VALUES", channel_id)
        for name, domain in mapping.items():
            require(Domain(app["x-nats-contract"]["tokenTypes"][domain]).accepts(values[name]), "TOKEN_VALUE", name)
        rendered = app["channels"][channel_id]["address"]
        for name, value in values.items():
            rendered = rendered.replace("{" + name + "}", value)
        return rendered

    def parse(self, filename: str, channel_id: str, subject: str) -> dict:
        app = self.app(filename)
        template = app["channels"][channel_id]["address"].split(".")
        actual = subject.split(".")
        require(len(template) == len(actual), "SUBJECT_PARSE", channel_id)
        values = {}
        for expected, received in zip(template, actual):
            match = re.fullmatch(r"[{]([^{}]+)[}]", expected)
            if match:
                values[match.group(1)] = received
            else:
                require(expected == received, "SUBJECT_PARSE", channel_id)
        require(self.render(filename, channel_id, values) == subject, "SUBJECT_PARSE", channel_id)
        return values

    def payload(self, filename: str, operation: dict) -> tuple[str, dict]:
        _, channel = self.resolve(filename, operation["channel"]["$ref"])
        require(len(channel.get("messages", {})) == 1, "EXAMPLE_MESSAGE_SELECTION", self.channel_id(operation))
        message_file, message = self.dereference(filename, next(iter(channel["messages"].values())))
        return self.dereference(message_file, message["payload"])

    def schema_at(self, filename: str, schema: dict, target: str) -> tuple[str, dict]:
        filename, schema = self.dereference(filename, schema)
        if not target:
            return filename, schema
        require(target.startswith("/"), "INVALID_POINTER", target)
        for key in target[1:].split("/"):
            key = key.replace("~1", "/").replace("~0", "~")
            require(key in schema.get("properties", {}), "PAYLOAD_BINDING", target)
            schema = schema["properties"][key]
            filename, schema = self.dereference(filename, schema)
        return filename, schema

    def resource(self, filename: str, resource: dict) -> dict:
        if resource["authority"] == "contract":
            return resource["config"]
        artifact = resource["artifact"]
        require(artifact["path"] in self.documents, "UNLOCKED_REFERENCE", artifact["path"])
        require(digest(safe_path(self.root, artifact["path"])) == artifact["sha256"], "ARTIFACT_HASH", artifact["path"])
        return pointer(self.documents[artifact["path"]], resource["pointer"])

    def adapter(self, profile: dict, name: str, kind: str) -> dict:
        require(name in profile.get("adapters", {}), "ADAPTER_REFERENCE", name)
        result = profile["adapters"][name]
        require(result["kind"] == kind, "ADAPTER_KIND", name)
        return result

    def validate_bindings(self, filename: str, interaction: dict, request: dict) -> None:
        app = self.app(filename)
        profile = app["x-nats-contract"]
        channel_id = self.channel_id(request)
        parameters = profile["channels"][channel_id]["parameters"]
        bindings = interaction["bindings"]
        require(set(bindings["subject"]) == set(parameters), "SUBJECT_BINDING", channel_id)
        payload_file, payload = self.payload(filename, request)
        targets = list(bindings["payload"])
        require(not any(a == "" or b.startswith(a + "/") for a in targets for b in targets if a != b),
                "OVERLAPPING_BINDINGS", channel_id)
        for field in payload.get("required", []):
            require("" in targets or "/" + field in targets or any(target.startswith("/" + field + "/") for target in targets),
                    "UNBOUND_PAYLOAD", field)
        for destination, source in [*bindings["subject"].items(), *bindings["payload"].items()]:
            key, value = next(iter(source.items()))
            if key == "input":
                require(value in interaction["inputs"], "INPUT_REFERENCE", value)
            elif key == "context":
                require(value in CONTEXT_FIELDS, "CONTEXT_REFERENCE", value)
            elif key == "branch":
                require(value in BRANCH_FIELDS, "BRANCH_REFERENCE", value)
        for target in targets:
            self.schema_at(payload_file, payload, target)
        for name, source in bindings["subject"].items():
            if "input" in source:
                domain_name = interaction["inputs"][source["input"]].get("tokenType")
                require(domain_name is not None, "SUBJECT_BINDING_TYPE", name)
                require(Domain(profile["tokenTypes"][domain_name]).equals(Domain(profile["tokenTypes"][parameters[name]])),
                        "SUBJECT_BINDING_TYPE", name)

    def validate_app(self, filename: str, check_hashes: bool = True) -> None:
        app = self.app(filename)
        profile = app["x-nats-contract"]
        errors = list(offline_validator(Draft202012Validator, self.profile_schema).iter_errors(profile))
        require(not errors, "PROFILE_STRUCTURE", filename + (": " + errors[0].message if errors else ""))
        for name, spec in profile["tokenTypes"].items():
            domain = Domain(spec)
            if spec["kind"] == "token":
                require(spec["minLength"] <= spec["maxLength"] and len(spec["prefix"]) <= spec["maxLength"],
                        "TOKEN_DOMAIN", name)
                require(set(spec["prefix"]) <= BASE_ALPHABET and any(domain.positions(n) for n in range(1, 129)),
                        "TOKEN_DOMAIN", name)
            else:
                require(all(domain.accepts(value) for value in spec["values"]), "TOKEN_DOMAIN", name)
        for alias, imported in profile.get("imports", {}).items():
            other = self.app(imported["path"])
            require(other["id"] == imported["contract"] and other["info"]["version"] == imported["version"],
                    "IMPORT_IDENTITY", alias)
            if check_hashes:
                require(digest(safe_path(self.root, imported["path"])) == imported["sha256"], "IMPORT_HASH", alias)
        concrete = {}
        for channel_id, channel in app["channels"].items():
            tokens = self.tokens(filename, channel_id)
            if tokens is not None:
                concrete[channel_id] = tokens
                require(channel_id in profile["channels"], "PARAMETER_MAPPING", channel_id)
                identity = profile["channels"][channel_id].get("publisherIdentity")
                if identity:
                    require(identity["peerParameter"] in profile["channels"][channel_id]["parameters"],
                            "IDENTITY_PARAMETER", channel_id)
        for channel_id, mapping in profile["channels"].items():
            family = concrete[channel_id]
            for filter_name, template in mapping.get("filters", {}).items():
                parts = template.split(".")
                require(all(parts), "FILTER_GRAMMAR", filter_name)
                tail = parts[-1] == ">"
                require(not any(">" in part for part in parts[:-1]), "FILTER_GRAMMAR", filter_name)
                fixed = parts[:-1] if tail else parts
                require(len(family) > len(fixed) if tail else len(family) == len(fixed), "FILTER_CHANNEL", filter_name)
                for index, part in enumerate(fixed):
                    if part == "*":
                        continue
                    require(not any(char in part for char in "*>") and not any(char.isspace() for char in part),
                            "FILTER_GRAMMAR", filter_name)
                    match = re.fullmatch(r"[{]([^{}]+)[}]", part)
                    if match:
                        parameter = match.group(1)
                        require(parameter in mapping["parameters"], "PARAMETER_MAPPING", parameter)
                        domain = Domain(profile["tokenTypes"][mapping["parameters"][parameter]])
                    else:
                        require("{" not in part and "}" not in part, "FILTER_GRAMMAR", filter_name)
                        domain = literal_domain(part)
                    require(family[index].intersects(domain), "FILTER_CHANNEL", filter_name)
        for left_id, left in concrete.items():
            for right_id, right in concrete.items():
                if left_id < right_id and len(left) == len(right):
                    require(not all(a.intersects(b) for a, b in zip(left, right)), "CHANNEL_OVERLAP", left_id + "/" + right_id)
        for name, adapter in profile.get("adapters", {}).items():
            for key in ["inputSchema", "outputSchema"]:
                require(adapter[key].startswith("#/components/schemas/"), "ADAPTER_SCHEMA", name)
                self.resolve(filename, adapter[key])
        for name, operation in profile["operations"].items():
            require(name in app["operations"], "OPERATION_REFERENCE", name)
            standard = app["operations"][name]
            require(standard["action"] == ("send" if "publish" in operation else "receive"), "DIRECTION_MISMATCH", name)
            channel_id = self.channel_id(standard)
            require(channel_id in app["channels"], "CHANNEL_REFERENCE", channel_id)
            if "requestReply" in operation:
                require(operation.get("publish", {}).get("api") == "core", "RPC_TRANSPORT", name)
                require("reply" in standard, "RPC_REPLY", name)
                _, reply = self.resolve(filename, standard["reply"]["channel"]["$ref"])
                require(reply.get("address") is None, "RPC_REPLY", name)
            elif standard["action"] == "send":
                require("reply" not in standard, "RPC_REPLY", name)
            if operation.get("publish", {}).get("api") == "jetstream":
                require(operation["publish"]["stream"] in profile.get("streams", {}), "STREAM_REFERENCE", name)
            if operation.get("subscribe", {}).get("api") == "jetstream":
                require(operation["subscribe"]["consumer"] in profile.get("consumers", {}), "CONSUMER_REFERENCE", name)
        for name, stream in profile.get("streams", {}).items():
            config = self.resource(filename, stream)
            require(offline_validator(Draft202012Validator, {"$ref": "#/$defs/streamConfig", "$defs": self.profile_schema["$defs"]}).is_valid(config), "NATIVE_STREAM", name)
        for name, consumer in profile.get("consumers", {}).items():
            require(consumer["stream"] in profile.get("streams", {}), "STREAM_REFERENCE", name)
            config = self.resource(filename, consumer)
            require(offline_validator(Draft202012Validator, {"$ref": "#/$defs/consumerConfig", "$defs": self.profile_schema["$defs"]}).is_valid(config), "NATIVE_CONSUMER", name)
        for name, interaction in profile.get("interactions", {}).items():
            audience, delivery, completion = interaction["audience"], interaction["delivery"], interaction["completion"]
            for key in ["input", "scopeInput"]:
                require(audience[key] in interaction["inputs"], "INPUT_REFERENCE", audience[key])
            self.adapter(profile, audience["resolver"], "audience")
            self.adapter(profile, audience["authorization"], "authorization")
            for value in interaction["inputs"].values():
                if "tokenType" in value:
                    require(value["tokenType"] in profile["tokenTypes"], "TOKEN_TYPE", value["tokenType"])
                else:
                    self.resolve(filename, value["schema"])
            for counterpart, direction in [("receiverOperation", "receive"), ("senderOperation", "send")]:
                if counterpart in interaction:
                    _, _, remote = self.operation(filename, interaction[counterpart])
                    require(remote["action"] == direction, "DIRECTION_MISMATCH", counterpart)
            mode = interaction["dispatch"]["mode"]
            require((mode == "none") == ("requestOperation" not in interaction), "DISPATCH_OPERATION", name)
            if "requestOperation" in interaction:
                _, _, request = self.operation(filename, interaction["requestOperation"])
                require(request["action"] == "send", "DIRECTION_MISMATCH", name)
                self.validate_bindings(filename, interaction, request)
            if mode in {"branches", "none"}:
                require(interaction["dispatch"].get("branchesInput") in interaction["inputs"], "BRANCH_MANIFEST", name)
            if mode == "one-eligible":
                require(completion.get("unit") == "distinct-branches", "ANYCAST_UNIT", name)
                self.adapter(profile, interaction["dispatch"].get("selector", ""), "selection")
            if completion["mode"] != "none":
                require("resultOperation" in interaction, "RESULT_OPERATION", name)
                _, _, result = self.operation(filename, interaction["resultOperation"])
                require(result["action"] == "receive", "DIRECTION_MISMATCH", name)
                self.adapter(profile, interaction["correlation"].get("verifier", ""), "result-verifier")
                result_channel = self.channel_id(result)
                require("publisherIdentity" in profile["channels"][result_channel], "IDENTITY_BINDING", result_channel)
                for field in ["operation", "branch", "attempt", "peer", "fence"]:
                    location = interaction["correlation"][field]
                    require(location.startswith("$message.payload#/"), "CORRELATION_LOCATION", field)
                    path = location.removeprefix("$message.payload#")
                    self.schema_at(*self.payload(filename, result), path)
                    if "requestOperation" in interaction:
                        self.schema_at(*self.payload(filename, request), path)
                if completion["mode"] == "quorum" and audience["kind"] == "peer":
                    require(completion.get("count", 1) <= 1, "IMPOSSIBLE_QUORUM", name)
                if completion.get("remaining") == "cooperative":
                    for key, direction in [("cancelOperation", "send"), ("cancelResultOperation", "receive")]:
                        _, _, cancel = self.operation(filename, completion[key])
                        require(cancel["action"] == direction, "CANCEL_OPERATION", name)
                    require(completion["cancelTimeoutMs"] <= delivery["settlementGraceMs"], "CANCEL_GRACE", name)
            if "aggregation" in interaction:
                self.adapter(profile, interaction["aggregation"], "aggregation")
            if delivery["state"] == "memory":
                require(delivery["maxAttempts"] == 1 and delivery["retryBackoffMs"] == 0
                        and delivery["restart"] == "fail-unknown" and audience["offline"] == "exclude",
                        "MEMORY_RECOVERY", name)
            else:
                self.adapter(profile, delivery.get("stateStore", ""), "state-store")
            if delivery["mode"] == "durable-per-recipient":
                self.adapter(profile, delivery.get("adapter", ""), "delivery")
                require(delivery["state"] == "durable" and delivery["restart"] == "resume", "DURABLE_RECOVERY", name)
                require(profile["operations"][interaction["requestOperation"]]["publish"]["api"] == "jetstream",
                        "DURABLE_TRANSPORT", name)
                config = self.resource(filename, profile["streams"][profile["operations"][interaction["requestOperation"]]["publish"]["stream"]])
                grace = completion.get("deadlineMs", 0) + delivery["recoveryGraceMs"] + delivery["settlementGraceMs"]
                require(config["storage"] == "file" and config["retention"] == "limits" and config["discard"] == "new",
                        "DURABLE_RETENTION", name)
                require(config["max_age"] >= grace * 1000000 and config["duplicate_window"] >= grace * 1000000,
                        "DURABLE_GRACE", name)
                if completion["mode"] != "none":
                    result_binding = profile["operations"][interaction["resultOperation"]].get("subscribe", {})
                    require(result_binding.get("api") == "jetstream", "DURABLE_RESULT_TRANSPORT", name)
                    result_consumer = profile["consumers"][result_binding["consumer"]]
                    result_stream = self.resource(filename, profile["streams"][result_consumer["stream"]])
                    require(result_stream["storage"] == "file" and result_stream["retention"] == "limits"
                            and result_stream["discard"] == "new", "DURABLE_RESULT_RETENTION", name)
                    require(result_stream["max_age"] >= grace * 1000000
                            and result_stream["duplicate_window"] >= grace * 1000000,
                            "DURABLE_RESULT_GRACE", name)
            if delivery["maxAttempts"] > 1:
                require(delivery["state"] == "durable" and "ownership" in delivery, "RETRY_OWNERSHIP", name)
            if "ownership" in delivery:
                ownership = delivery["ownership"]
                self.adapter(profile, ownership["adapter"], "ownership")
                require(ownership["renewEveryMs"] * 2 < ownership["leaseMs"], "LEASE_RENEWAL", name)
        for name, pipeline in profile.get("pipelines", {}).items():
            for index, step in enumerate(pipeline["steps"]):
                if "interaction" in step:
                    require(step["interaction"] in profile.get("interactions", {}), "PIPELINE_REFERENCE", name)
                else:
                    _, _, operation = self.operation(filename, step["operation"])
                    require(operation["action"] == "send", "PIPELINE_DIRECTION", name)
                if "inputAdapter" in step:
                    self.adapter(profile, step["inputAdapter"], "transform")
                require(index > 0 or "inputAdapter" not in step, "PIPELINE_ROOT_INPUT", name)

    def validate_links(self) -> None:
        linked = set()
        apps = {name: doc for name, doc in self.documents.items() if "x-nats-contract" in doc}
        for filename, app in apps.items():
            for link in app["x-nats-contract"].get("links", []):
                send_file, send_id, send = self.operation(filename, link["send"])
                receive_file, receive_id, receive = self.operation(filename, link["receive"])
                require(send["action"] == "send" and receive["action"] == "receive", "LINK_DIRECTION", filename)
                left = self.tokens(send_file, self.channel_id(send))
                right = self.tokens(receive_file, self.channel_id(receive))
                require(left is not None and right is not None and len(left) == len(right)
                        and all(a.equals(b) for a, b in zip(left, right)), "LINK_LANGUAGE", filename)
                left_file, left_schema = self.payload(send_file, send)
                right_file, right_schema = self.payload(receive_file, receive)
                require(self.schema_value(left_file, left_schema) == self.schema_value(right_file, right_schema),
                        "LINK_MESSAGE", filename)
                linked.add(frozenset({(send_file, self.channel_id(send)), (receive_file, self.channel_id(receive))}))
        app_names = sorted(apps)
        for index, left_file in enumerate(app_names):
            for right_file in app_names[index + 1:]:
                for left_id in apps[left_file]["channels"]:
                    for right_id in apps[right_file]["channels"]:
                        left, right = self.tokens(left_file, left_id), self.tokens(right_file, right_id)
                        if left and right and len(left) == len(right) and all(a.intersects(b) for a, b in zip(left, right)):
                            require(frozenset({(left_file, left_id), (right_file, right_id)}) in linked,
                                    "UNLINKED_CHANNEL_OVERLAP", left_id + "/" + right_id)


def update_lock(root: Path) -> None:
    documents = {name: load_document(root / name) for name in DEFAULT_FILES}
    for name, doc in documents.items():
        if "x-nats-contract" not in doc:
            continue
        source = (root / name).read_text()
        profile = doc["x-nats-contract"]
        for resources in [profile.get("streams", {}), profile.get("consumers", {})]:
            for resource in resources.values():
                if resource["authority"] == "external":
                    artifact = resource["artifact"]
                    updated = digest(safe_path(root, artifact["path"]))
                    source = source.replace(artifact["sha256"], updated)
                    artifact["sha256"] = updated
        (root / name).write_text(source)
    visited = set()
    def update_imports(name: str, active: set[str]) -> None:
        require(name not in active, "IMPORT_CYCLE", name)
        if name in visited:
            return
        doc = documents[name]
        source = (root / name).read_text()
        for imported in doc.get("x-nats-contract", {}).get("imports", {}).values():
            update_imports(imported["path"], active | {name})
            updated = digest(safe_path(root, imported["path"]))
            source = source.replace(imported["sha256"], updated)
            imported["sha256"] = updated
        (root / name).write_text(source)
        visited.add(name)
    for name in documents:
        update_imports(name, set())
    lock = {"version": 1, "entrypoints": DEFAULT_FILES[:2],
            "files": [{"path": name, "sha256": digest(root / name)} for name in DEFAULT_FILES]}
    rendered = json.dumps(lock, indent=2)
    entrypoint_array = json.dumps(lock["entrypoints"])
    rendered = re.sub(r'"entrypoints": \[[^\]]*\]', '"entrypoints": ' + entrypoint_array, rendered, count=1)
    (root / "bundle.lock.json").write_text(rendered + "\n")


def load_bundle(root: Path) -> Bundle:
    lock = load_document(root / "bundle.lock.json")
    require(set(lock) == {"version", "entrypoints", "files"} and lock["version"] == 1, "LOCK_STRUCTURE", "root")
    documents = {}
    for entry in lock["files"]:
        require(set(entry) == {"path", "sha256"}, "LOCK_STRUCTURE", "entry")
        name = entry["path"]
        require(name not in documents, "LOCK_DUPLICATE", name)
        target = safe_path(root, name)
        require(target.exists() and digest(target) == entry["sha256"], "LOCK_HASH", name)
        documents[name] = load_document(target)
    require(set(lock["entrypoints"]) <= documents.keys(), "LOCK_ENTRYPOINT", "entrypoints")
    profile_schema = documents["nats-contract-profile.schema.json"]
    Draft202012Validator.check_schema(profile_schema)
    Draft7Validator.check_schema(documents["adapter-contracts.schema.json"])
    bundle = Bundle(root, documents, profile_schema)
    identities = set()
    for name in lock["entrypoints"]:
        doc = documents[name]
        identity = (doc["id"], doc["info"]["version"])
        require(identity not in identities, "CONTRACT_IDENTITY", name)
        identities.add(identity)
    def walk(filename: str, node: Any, seen: set) -> None:
        if isinstance(node, dict):
            if "$ref" in node:
                ref = node["$ref"]
                if ref.startswith("#/$defs/") and filename == "nats-contract-profile.schema.json":
                    pointer(documents[filename], ref)
                else:
                    target_file, value = bundle.resolve(filename, ref)
                    identity = (target_file, ref)
                    if identity not in seen:
                        walk(target_file, value, seen | {identity})
            for key, value in node.items():
                if key != "$ref":
                    walk(filename, value, seen)
        elif isinstance(node, list):
            for value in node:
                walk(filename, value, seen)
    for name, doc in documents.items():
        walk(name, doc, set())
    return bundle


def mutate(doc: dict, edits: list[dict]) -> None:
    for edit in edits:
        path = edit["path"]
        parent_path, _, key = path.rpartition("/")
        key = key.replace("~1", "/").replace("~0", "~")
        parent = pointer(doc, "#" + parent_path if parent_path else "")
        if edit["op"] == "set":
            parent[key] = copy.deepcopy(edit["value"])
        elif edit["op"] == "remove":
            del parent[key]
        elif edit["op"] == "copy":
            parent[key] = copy.deepcopy(pointer(doc, "#" + edit["from"]))
        else:
            raise Diagnostic("FIXTURE_KIND", edit["op"])


def completion_vector(case: dict) -> dict:
    admitted = case["manifest"]
    records = {item["branchId"]: dict(item, status="pending") for item in admitted}
    require(len(records) == len(admitted) and bool(records), "AUDIENCE", case["id"])
    policy = case["policy"]
    peers = {item["peerId"] for item in admitted}
    size = len(peers) if policy["unit"] == "distinct-peers" else len(records)
    threshold = policy.get("count")
    if "fraction" in policy:
        fraction = policy["fraction"]
        threshold = (fraction["numerator"] * size + fraction["denominator"] - 1) // fraction["denominator"]
    if policy["mode"] == "first-success":
        threshold = 1
    elif policy["mode"] in {"all-successful", "all-terminal"}:
        threshold = size
    require(threshold is not None and 0 < threshold <= size, "IMPOSSIBLE_QUORUM", case["id"])
    outcome = "pending"
    rejected = 0
    counted = 0
    for event in case["events"]:
        if outcome != "pending":
            rejected += 1
            continue
        if event["kind"] == "deadline":
            outcome = "partial" if policy["onTimeout"] == "partial" else "failed"
            continue
        require(event["kind"] == "result", "FIXTURE_KIND", event["kind"])
        branch = records.get(event["branchId"])
        if not branch or branch["status"] != "pending" or any(branch[key] != event[key] for key in ["peerId", "attempt", "fence"]):
            rejected += 1
            continue
        branch["status"] = event["status"]
        success = {value["peerId"] if policy["unit"] == "distinct-peers" else key
                   for key, value in records.items() if value["status"] == "success"}
        counted = len(success)
        possible = {value["peerId"] if policy["unit"] == "distinct-peers" else key
                    for key, value in records.items() if value["status"] in {"pending", "success"}}
        if policy["mode"] == "all-terminal":
            if all(value["status"] != "pending" for value in records.values()):
                outcome = "success"
        elif counted >= threshold:
            outcome = "success"
        elif len(possible) < threshold:
            outcome = "failed"
    return {"outcome": outcome, "counted": counted, "rejected": rejected, "threshold": threshold}


def run_cases(bundle: Bundle, cases_path: Path) -> int:
    document = load_document(cases_path)
    require(document["version"] == 1, "FIXTURE_VERSION", str(document["version"]))
    count = 0
    for case in document["cases"]:
        kind = case["kind"]
        if kind == "token":
            domain = Domain(bundle.app(case["contract"])["x-nats-contract"]["tokenTypes"][case["tokenType"]])
            require(all(domain.accepts(value) for value in case["valid"])
                    and all(not domain.accepts(value) for value in case["invalid"]), "FIXTURE_RESULT", case["id"])
        elif kind == "render-parse":
            actual = bundle.render(case["contract"], case["channel"], case["parameters"])
            require(actual == case["subject"], "FIXTURE_RESULT", case["id"])
            require(bundle.parse(case["contract"], case["channel"], actual) == case["parameters"], "FIXTURE_RESULT", case["id"])
            for subject in case["invalidSubjects"]:
                try:
                    bundle.parse(case["contract"], case["channel"], subject)
                except Diagnostic:
                    continue
                raise Diagnostic("FIXTURE_RESULT", case["id"])
        elif kind == "invalid-contract":
            documents = copy.deepcopy(bundle.documents)
            mutate(documents[case["contract"]], case["edits"])
            mutated = Bundle(bundle.root, documents, bundle.profile_schema)
            try:
                mutated.validate_app(case["contract"], check_hashes=False)
            except Diagnostic as error:
                require(error.code == case["diagnostic"], "FIXTURE_DIAGNOSTIC", case["id"] + ": " + error.code)
            else:
                raise Diagnostic("FIXTURE_ACCEPTED_INVALID", case["id"])
        elif kind == "invalid-yaml":
            try:
                yaml.load(case["source"], Loader=UniqueLoader)
            except Diagnostic as error:
                require(error.code == case["diagnostic"], "FIXTURE_DIAGNOSTIC", case["id"])
            else:
                raise Diagnostic("FIXTURE_ACCEPTED_INVALID", case["id"])
        elif kind == "schema-value":
            schema = dict(bundle.documents["adapter-contracts.schema.json"])
            schema["$ref"] = "#/definitions/" + case["definition"]
            actual = offline_validator(Draft7Validator, schema).is_valid(case["value"])
            require(actual == case["valid"], "FIXTURE_RESULT", case["id"])
        elif kind == "time-guard":
            guard = case["guard"]
            actual = guard["notBeforeMs"] <= case["committedAtMs"] < guard["notAfterMs"]
            require(actual == case["allowed"], "FIXTURE_RESULT", case["id"])
        elif kind == "invocation-id":
            material = b"".join(len(value.encode("utf-8")).to_bytes(8, "big") + value.encode("utf-8")
                                for value in [case["principalId"], case["contractDigest"], case["invocationKey"]])
            actual = "op" + hashlib.sha256(material).hexdigest()
            require(actual == case["expected"], "FIXTURE_RESULT", case["id"])
        elif kind == "completion":
            try:
                result = completion_vector(case)
            except Diagnostic as error:
                require(error.code == case.get("diagnostic"), "FIXTURE_DIAGNOSTIC", case["id"])
            else:
                require(result == case["expected"], "FIXTURE_RESULT", case["id"] + ": " + json.dumps(result))
        else:
            raise Diagnostic("FIXTURE_KIND", kind)
        count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets", type=Path, default=Path(__file__).resolve().parents[1] / "assets")
    parser.add_argument("--update-lock", action="store_true", help="Explicitly refresh imported/native hashes and exact-byte lock entries.")
    parser.add_argument("--asyncapi-schema", type=Path, help="Optional local, bundled AsyncAPI 3.1.0 JSON Schema; never fetched.")
    args = parser.parse_args()
    if args.update_lock:
        update_lock(args.assets)
    bundle = load_bundle(args.assets)
    if args.asyncapi_schema:
        standard = load_document(args.asyncapi_schema)
        Draft7Validator.check_schema(standard)
        for name, document in bundle.documents.items():
            if "asyncapi" in document:
                errors = list(offline_validator(Draft7Validator, standard).iter_errors(document))
                require(not errors, "ASYNCAPI_STRUCTURE", name + (": " + errors[0].message if errors else ""))
    for name, document in bundle.documents.items():
        if "x-nats-contract" in document:
            bundle.validate_app(name)
    bundle.validate_links()
    count = run_cases(bundle, args.assets / "conformance-cases.json")
    print(f"PASS: locked bundle, application/profile references and {count} conformance fixtures")
    print("Evidence: offline structural/semantic example checks and pure completion vectors; no broker, generator or executor certification.")


if __name__ == "__main__":
    try:
        main()
    except Diagnostic as error:
        raise SystemExit(str(error)) from error
