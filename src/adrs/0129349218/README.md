---
id: '0129349218'
title: Universal Error Specification
state: Draft
created: 2022-11-3
tags: [error]
---

## Context

This specification standardizes error formats for services and applications, providing a consistent structure for error reporting. Adopting this standard leads to better observability, improved debugging, and enhanced user experiences in distributed systems.

Structured error handling is challenging in modern distributed systems due to communication across diverse service boundaries. Current approaches often suffer from several issues:

- **Inconsistent formats**: Each team and technology stack defines its own error structures, making integration difficult.
- **Limited metadata**: Most error formats lack the structured context needed for automation and observability.
- **Poor correlation**: Tracing related errors across service boundaries is difficult without consistent identifiers.
- **Localization challenges**: Error messages are often hardcoded in English without proper translation support.
- **Security concerns**: Sensitive information in errors is frequently exposed to end-users inappropriately.

Our analysis of existing systems reveals that developers spend significant time translating between error formats, parsing unstructured text for error details, and manually correlating errors across services. The goal of this specification is not to solve every problem related to error handling but to establish a shared standard that promotes craftsmanship and alignment across our codebases, drawing from lessons learned and modern software development practices.

## Out of Scope

- **Performance Considerations**: This specification does not prioritize performance. While the proposed structure should be efficient enough for most use cases, systems where every byte counts may require a more compact, custom representation.

## Decision Drivers

To address the challenges above, the design of the universal error format is guided by the following principles:

- **Data-Oriented Approach**: Treat errors as serializable data structures, independent of any programming language or transport mechanism.
- **Identity and Correlation**: Provide a stable error identity to facilitate troubleshooting and communication in distributed systems.
- **Documentation and End-User Communication**: Treat errors as a formal part of the API surface, with clear documentation for both developers and end-users.
- **Validation and Input Handling**: Support detailed, field-level validation errors to provide precise feedback.
- **Localization**: Enable multi-language error messages to support a global user base.
- **Batching and Wrapping**: Allow for handling batch operations and nested error contexts gracefully.

## Considered Design

### Data-Oriented Approach

Errors should be treated as data structures that can be serialized and deserialized across system boundaries. This enables consistent error handling regardless of the underlying technology stack. System exceptions should be mapped to this structure, providing a uniform error model throughout the application stack. An error is just another message in the system, agnostic of language or framework specifics.

### Identity and Correlation

In a distributed system, a stable error identity is crucial for communication and troubleshooting among various actors (customers, support, developers, SREs). A consistent identity enables:

- Cross-system error tracing and aggregation.
- Unambiguous error referencing between teams.
- Simplified debugging by connecting related error instances.

To avoid coordination in distributed systems, the identity is composed of multiple dimensions:

- `domain`: A logical grouping that identifies the service or component generating the error (e.g., `com.myapp.iam`).
- `reason`: A specific error code within that domain (e.g., `INVALID_TOKEN`).
- `id`: A unique instance identifier (e.g., a UUID) for the specific error occurrence.

The combination of `domain` and `reason` provides context, while the `id` tracks a specific instance. For example, a `NOT_FOUND` reason is generic, but when combined with a domain like `com.app.bank_transfer`, it becomes clear what kind of resource was not found.

```json
{
  "domain": "com.app.bank_transfer",
  "reason": "NOT_FOUND",
  "metadata": { "transfer_id": "709b4d54-04ee-4e82-89a3-4bdf07462809" }
}
```

This structure allows infrastructure to map errors to HTTP status codes (e.g., `NOT_FOUND` to 404) without parsing proprietary error types.

### Documentation and End-User Communication

Errors are part of the API surface and must be well-documented. The specification includes fields to support this:

- `message`: A developer-focused, human-readable description of the error in English.
- `help`: A link to detailed documentation about the error.
- `info.metadata`: Structured data providing additional context.

Developers should not rely on the `message` field for programmatic error handling; `domain` and `reason` should be used instead.

### Localization

Errors displayed to end-users should be localized. The `domain`, `reason`, and `metadata` fields provide the necessary components for translation. For example, a translation service can use these fields to look up the correct message template and interpolate values.

Example translation data:

```js
const translations = {
  'com.myapp.bank_transfer': {
    TRANSFER_LIMIT_EXCEEDED: 'You have reached the transfer limit of {{limit}}.',
  },
};
```

Example error:

```js
const error = {
  info: {
    domain: 'com.myapp.bank_transfer',
    reason: 'TRANSFER_LIMIT_EXCEEDED',
    metadata: { limit: '2000' },
  },
  // ...
};
```

The `localized_message` field can be used to include the translated message directly in the error object. This field should typically be added at the edge of the system (e.g., the application layer), where the end-user's locale is known. It is an anti-pattern to add it in the core domain layers.

### Secure Metadata Handling

To mitigate the risk of exposing sensitive information, the `info.metadata` and `debug_info.metadata` fields must be handled with care. Developers must ensure that no sensitive data—such as personally identifiable information (PII), credentials, or internal system configurations—is inadvertently included in these fields, especially in `info.metadata`, which may be propagated to user-facing messages or less secure logging environments.

The following guidelines should be followed:

- **Principle of Least Information**: Include only the minimal information in `metadata` necessary for debugging and error analysis. Avoid logging entire data objects or complex structures.
- **Sanitization and Anonymization**: Before adding data to `metadata`, apply sanitization routines to strip or anonymize sensitive fields. For example, mask credit card numbers, redact user emails, and remove passwords.
- **Use `debug_info` for Sensitive Details**: Information that is strictly for internal debugging and carries a higher risk of containing sensitive details (e.g., raw downstream service responses, detailed query parameters) should be placed in `debug_info.metadata`. The `debug_info` object as a whole MUST be stripped before sending an error outside of a trusted service boundary, as governed by the `visibility` property.
- **Avoid Unstructured Data**: Favor structured, well-defined keys in metadata over dumping unstructured string blobs. This makes it easier to implement automated scanning and filtering for sensitive data patterns.
- **Regular Audits**: Periodically audit the contents of `info.metadata` being generated by services to ensure compliance with data protection policies.

By adhering to these practices, we can leverage the flexibility of metadata while minimizing the risk of sensitive data leakage.

### Debug Info

The generation of `debug_info` should be a controlled process, not an automatic default for every error.

Avoid generating stack traces or other expensive debug information proactively. Instead, generate it only when it's determined to be necessary, for example, based on the error's severity or type. For user-facing errors like input validation (`INVALID_ARGUMENT`), `debug_info` is often unnecessary.

### Batching and Wrapping Errors

The specification supports scenarios where multiple errors need to be reported together or where an error needs to be wrapped with additional context. The `causes` field, which is an array of `UniversalError` objects, is used for this purpose. This is useful for:

- **Batch operations**: Reporting all errors that occurred during a batch process in a single response.
- **Error wrapping**: Adding context to an error from a downstream service.

### Validation and Input Handling

For input validation, it is critical to provide precise feedback about which fields are invalid. The `subject` field, which can be a JSON Pointer (`RFC 6901`), identifies the specific input field that caused the error.

For example, given the following command payload:

```js
const command = {
  data: { amount: '1000', currency: 'CUP' },
};
```

An error response can pinpoint the invalid field:

```js
const error = {
  subject: '/data',
  info: {
    domain: 'com.mybusiness.myapp',
    reason: 'BAD_REQUEST',
  },
  code: 'INVALID_ARGUMENT',
  causes: [
    {
      subject: '/currency',
      info: {
        domain: 'com.mybusiness.myapp',
        reason: 'INVALID_CURRENCY',
        metadata: { valid_currencies: 'USD' },
      },
      // ...
    },
  ],
};
```

This structure allows a UI to display validation errors next to the corresponding input fields. When wrapping errors, the `subject` remains relative to its local context.

## Resolution

The structure of the Universal Error is defined as follows:

```typescript
type UniversalError = {
  specversion: SpecVersion;
  code: Code;
  message: MessageTemplate;
  info: ErrorInfo;
  causes: UniversalError[];
  visibility: Visibility;

  //
  // Optional Information
  //
  subject?: Subject;
  indeterministic_info?: IndeterministicInfo;
  help?: Help;
  debug_info?: DebugInfo;
  localized_message?: LocalizedMessage;
  /**
   * Describes when a client can retry a failed request.
   */
  retry_info?: RetryInfo;
};

/**
 * The version of the specification that the error uses.
 * Monotonically increasing version numbers are used to identify the evolution
 * of the error format. The version number is represented as a non-negative
 * integer.
 */
type SpecVersion = integer;

enum Visibility {
  /**
   * The error is intended for internal consumption and must not be shown to
   * the client. When an error with `INTERNAL` visibility is caught at a service
   * boundary, it should be logged for debugging, but a generic, non-revealing
   * error message should be returned to the client. This is the most
   * restrictive scope.
   */
  INTERNAL = 0,
  /**
   * The error can be shared with other services within the same organization
   * or trusted environment, but not with external third parties. This allows
   * for more detailed error information, including `debug_info`, to be
   * exchanged between internal systems. The `debug_info` field MUST be
   * stripped before the error is sent outside the trusted organization
   * boundary.
   */
  PRIVATE = 1,
  /**
   * The error can be shown to any client, including external businesses or
   * end-users. The `debug_info` field MUST always be stripped from errors
   * with this visibility level. This is the least restrictive scope.
   */
  PUBLIC = 2,
}

enum Code {
  CANCELLED = 499,
  UNKNOWN = 500,
  INVALID_ARGUMENT = 400,
  DEADLINE_EXCEEDED = 504,
  NOT_FOUND = 404,
  ALREADY_EXISTS = 409,
  PERMISSION_DENIED = 403,
  UNAUTHENTICATED = 401,
  RESOURCE_EXHAUSTED = 429,
  FAILED_PRECONDITION = 422,
  ABORTED = 409,
  OUT_OF_RANGE = 400,
  UNIMPLEMENTED = 501,
  INTERNAL = 500,
  UNAVAILABLE = 503,
  DATA_LOSS = 500,
}

/**
 * Message contains a generic description of the error condition in English.
 *
 * Warning: Error messages are not part of the API surface. They are subject to
 * changes without notice. Application code must not have a hard dependency on
 * error messages.
 *
 * It is intended for a human audience. Simple programs display the message
 * directly to the end user if they encounter an error condition they don't
 * know how or don't care to handle. Sophisticated programs with more
 * exhaustive error handling and proper internationalization are more likely
 * to ignore the error message.
 *
 * Messages MAY use {placeholders}. To prevent security vulnerabilities, these
 * placeholders MUST only reference values from the `info.metadata` field.
 */
type MessageTemplate = string;

/**
 * Subject identifies the specific entity or element that caused the error
 * within the context defined by `info.domain`. This provides a granular
 * pointer to the root of the problem, whether it originates from user input,
 * service-to-service communication, or an internal process.
 *
 * For example, when validating a message payload, the `subject` can be a
 * JSON Pointer (`RFC 6901`) indicating the field that failed validation, such as
 * `"/data/email"`. In other cases, it might be an application-specific
 * identifier for a resource, like a user ID or transaction ID.
 *
 * This enables precise, programmatic error handling, allowing a client to
 * highlight an invalid field in a UI or a backend service to trigger specific
 * compensation logic.
 */
type Subject = string;

/**
 * IndeterministicInfo contains information that is not deterministic and
 * could change over time. Critical for debugging purposes, but not critical
 * for the end-user, unless they give the information to the support team.
 */
type IndeterministicInfo = {
  /**
   * ID identifies the error. The combination of info + id is unique for each
   * distinct error event. Consumers MAY assume that error events with identical
   * source and id are duplicates.
   */
  id: string;

  /**
   * Time timestamp of when the occurrence happened.
   */
  time: Timestamp;
};

/**
 * Domain identifies the context in which an error happened.
 */
type ErrorInfo = {
  /**
   * The reason of the error. This is a constant value that identifies the
   * proximate cause of the error. Error reasons are unique within a particular
   * domain of errors. This should be at most 63 characters and match a regular
   * expression of `[A-Z][A-Z0-9_]+[A-Z0-9]`, which represents UPPER_SNAKE_CASE.
   */
  reason: string;

  /**
   * The logical grouping to which the "reason" belongs. The error domain is
   * typically the registered service name of the tool or product that generates
   * the error. Example: "pubsub.googleapis.com". If the error is generated by
   * some common infrastructure, the error domain must be a globally unique value
   * that identifies the infrastructure. For Google API infrastructure, the error
   * domain is "googleapis.com".
   */
  domain: string;

  /**
   * Additional structured details about this error. Values in this field MUST
   * be carefully sanitized to avoid leaking sensitive information. See the
   * "Secure Metadata Handling" section for detailed guidance.
   */
  metadata: Record<string, string>;
};

type HelpLink = {
  /**
   * Describes what the link offers.
   */
  description: string;

  /**
   * The URL of the link.
   */
  url: string;
};

type Help = {
  /**
   * URL(s) pointing to additional information on handling the current error.
   */
  links: Array<HelpLink>;
};

/**
 * Contains the stack trace of the error and other debug information.
 *
 * This field is intended for internal logging and debugging only. It MUST be
 * stripped from any error payload sent to an external client or end-user.
 * Exposure of this information can lead to severe security vulnerabilities.
 * In practice, you should only send the debug information to internal logging
 * systems and remove it when sending the error to the client.
 */
type DebugInfo = {
  /**
   * The stack trace entries indicating where the error occurred.
   */
  stack_entries: string[];

  /**
   * Additional debugging information provided by the server. While this entire
   * `DebugInfo` object is intended for internal use, care should still be
   * taken to avoid unnecessarily logging highly sensitive data.
   */
  metadata: Record<string, string>;
};

/**
 * Provides a localized error message that is safe to return to the user which
 * can be attached to an RPC error.
 */
type LocalizedMessage = {
  /**
   * The locale used following the specification defined at
   * https://www.rfc-editor.org/rfc/bcp/bcp47.txt.
   * Examples are: "en-US", "fr-CH", "es-MX"
   */
  locale: string;

  /**
   * The localized error message in the above locale.
   */
  message: string;
};

type RetryDuration = {
  /**
   * Specifies a duration to wait before retrying the request.
   */
  retry_offset: Duration;
};

type RetryTime = {
  /**
   * Specifies an absolute timestamp after which to retry the request.
   */
  retry_time: Timestamp;
};

/**
 * Describes when a client can retry a failed request, similar to the HTTP
 * `Retry-After` header. It specifies either a duration to wait or an absolute
 * timestamp after which to retry.
 *
 * Clients may ignore this information but are encouraged to follow it. When
 * retrying, clients should use an exponential backoff strategy. If
 * `retry_offset` is provided, it can serve as the initial backoff interval.
 *
 * A server MUST NOT provide both `retry_offset` and `retry_time`.
 */
type RetryInfo = RetryDuration | RetryTime;

type Int64 = number;
type Int32 = number;

/**
 * A Timestamp represents a point in time independent of any time zone or local
 * calendar, encoded as a count of seconds and fractions of seconds at
 * nanosecond resolution. The count is relative to an epoch at UTC midnight on
 * January 1, 1970, in the proleptic Gregorian calendar which extends the
 * Gregorian calendar backwards to year one.
 *
 * String in the [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format.
 */
type Timestamp = {
  // Represents seconds of UTC time since Unix epoch
  // 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
  // 9999-12-31T23:59:59Z inclusive.
  seconds: Int64;

  // Non-negative fractions of a second at nanosecond resolution. Negative
  // second values with fractions must still have non-negative nanos values
  // that count forward in time. Must be from 0 to 999,999,999
  // inclusive.
  nanos: Int32;
};

type Duration = {
  /**
   * Signed seconds of the span of time. Must be from -315,576,000,000
   * to +315,576,000,000 inclusive. Note: these bounds are computed from:
   * 60 sec/min * 60 min/hr * 24 hr/day * 365.25 days/year * 10000 years
   */
  seconds: Int64;

  /**
   * Signed fractions of a second at nanosecond resolution of the span
   * of time. Durations less than one second are represented with a 0
   * `seconds` field and a positive or negative `nanos` field. For durations
   * of one second or more, a non-zero value for the `nanos` field must be
   * of the same sign as the `seconds` field. Must be from -999,999,999
   * to +999,999,999 inclusive.
   */
  nanos: Int32;
};
```

## Links

- [ADR#6860374633](../6860374633/README.md)

- <https://google.aip.dev/193>
- <https://www.twilio.com/docs/api/errors>
- <https://docs.knock.app/reference#error-codes>
- <https://plaid.com/docs/errors/>
- <https://www.rfc-editor.org/rfc/rfc7807>
- <https://github.com/public-apis/public-apis>
- <https://github.com/github/rest-api-description>
- <https://stripe.com/docs/api#errors>
- <https://stripe.com/docs/error-handling>
- <https://cloud.google.com/translate/docs/reference/rest/Shared.Types/ListOperationsResponse#Status>
- <https://cloud.google.com/apis/design/errors>
- <https://raw.githubusercontent.com/sendgrid/sendgrid-oai/main/oai.yaml>
- <https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/errors>
- <https://binance-docs.github.io/apidocs/spot/en/#general-api-information>
- <https://docs.cloud.coinbase.com/exchange/docs/websocket-errors>
- <https://develop.sentry.dev/sdk/event-payloads/exception/>
- <https://develop.sentry.dev/sdk/event-payloads/>
- <https://develop.sentry.dev/sdk/event-payloads/types/>
- <https://datatracker.ietf.org/doc/html/rfc7807>
- <https://cloud.google.com/storage/docs/json_api/v1/status-codes>
- <https://laravel.com/docs/9.x/validation#validation-error-response-format>
- <https://owasp.org/www-community/Improper_Error_Handling>
- <https://owasp.org/www-project-developer-guide/draft/design/web_app_checklist/handle_errors_and_exceptions/>
- <https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet>
- <https://top10proactive.owasp.org/v3/en/c10-errors-exceptions>
- <https://github.com/open-telemetry/semantic-conventions/issues/2064>
- <https://messagetemplates.org/>
- <https://devguide.owasp.org/en/12-appendices/01-implementation-dos-donts/06-exception-error-handling/>
