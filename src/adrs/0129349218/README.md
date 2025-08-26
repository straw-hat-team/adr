---
id: '0129349218'
title: Error Specification
state: Approved
created: 2022-11-03
tags: [error]
category: General
---

# Error Specification

## Context

This specification standardizes error formats for services and applications, providing a consistent structure for error reporting. Adopting this standard leads to better observability, improved debugging, and enhanced user experiences in distributed systems.

Structured error handling is challenging in modern distributed systems due to communication across diverse service boundaries. Current approaches often suffer from several issues:

- **Inconsistent formats**: Each team and technology stack defines its own error structures, making integration difficult.
- **Limited metadata**: Most error formats lack the structured context needed for automation and observability.
- **Poor correlation**: Tracing related errors across service boundaries is difficult without consistent identifiers.
- **Localization challenges**: Error messages are often hardcoded in English without proper translation support.
- **Security concerns**: Sensitive information in errors is frequently exposed to end-users inappropriately.

Our analysis reveals that developers spend significant time translating between error formats, parsing unstructured text for error details, and manually correlating errors across services. This specification establishes a shared standard that promotes craftsmanship and alignment across codebases, drawing from lessons learned and modern software development practices.

## Out of Scope

- **Performance Considerations**: This specification does not prioritize performance. While the proposed structure should be efficient enough for most use cases, systems with extreme performance requirements (e.g., high-frequency trading, embedded systems, real-time gaming) may require more compact, custom representations or binary serialization formats.

## Decision Drivers

The design of the error format is guided by the following principles:

- **Data-Oriented Approach**: Treat errors as serializable data structures, independent of any programming language or transport mechanism.
- **Specification Evolution**: Enable the error format to evolve over time while maintaining backward compatibility and clear versioning.
- **Identity and Correlation**: Provide a stable error identity to facilitate troubleshooting and communication in distributed systems.
- **Security and Visibility Controls**: Control information disclosure across trust boundaries to prevent sensitive data leakage.
- **Documentation and End-User Communication**: Treat errors as a formal part of the API surface, with clear documentation for both developers and end-users.
- **Validation and Input Handling**: Support detailed, field-level validation errors to provide precise feedback.
- **Localization**: Enable multi-language error messages to support a global user base.
- **Temporal Context and Observability**: Provide timing information and source traceability for debugging and monitoring.
- **Retry and Recovery Patterns**: Guide clients on when and how to retry failed operations.
- **Batching and Wrapping**: Allow for handling batch operations and nested error contexts gracefully.

## Considered Design

This section explains the rationale behind each field in the Error structure.

### Specification Versioning

The `specversion` field enables evolution of the error format over time. As distributed systems mature and new requirements emerge, the specification itself must be versioned to ensure compatibility. Using monotonically increasing integers (1, 2, 3, etc.) provides a simple, unambiguous versioning scheme that avoids the complexity of semantic versioning for data structure specifications.

### Error Codes and HTTP Mapping

The `code` field provides a standardized set of error categories with unique identifiers that can be consistently mapped to HTTP status codes across different services. This eliminates the need for custom error code mappings and ensures that infrastructure components (load balancers, API gateways, monitoring systems) can handle errors uniformly without parsing domain-specific error types.

Each code represents a class of errors with specific HTTP status code mappings (via the `getHttpStatusCode` function), enabling consistent error handling across different transport protocols while maintaining unique error code values for precise identification.

| Code                  | HTTP Status | Description                                  |
| --------------------- | ----------- | -------------------------------------------- |
| `CANCELLED`           | 499         | Request cancelled by the client              |
| `UNKNOWN`             | 500         | Unknown error                                |
| `INVALID_ARGUMENT`    | 400         | Invalid argument provided by client          |
| `DEADLINE_EXCEEDED`   | 504         | Deadline exceeded before operation completed |
| `NOT_FOUND`           | 404         | Requested entity was not found               |
| `ALREADY_EXISTS`      | 409         | Entity already exists                        |
| `PERMISSION_DENIED`   | 403         | Client lacks permission for the operation    |
| `RESOURCE_EXHAUSTED`  | 429         | Resource exhausted (e.g., rate limit, quota) |
| `FAILED_PRECONDITION` | 400         | Precondition failed                          |
| `ABORTED`             | 409         | Operation aborted                            |
| `OUT_OF_RANGE`        | 400         | Value out of valid range                     |
| `UNIMPLEMENTED`       | 501         | Operation not implemented                    |
| `INTERNAL`            | 500         | Internal server error                        |
| `UNAVAILABLE`         | 503         | Service unavailable                          |
| `DATA_LOSS`           | 500         | Unrecoverable data loss or corruption        |
| `UNAUTHENTICATED`     | 401         | Client not authenticated                     |

### Message Templates and Internationalization

The `message` field serves as a fallback human-readable description in English. By treating messages as templates with `{placeholder}` syntax, we enable consistent formatting while maintaining security through visibility-aware placeholder resolution. Placeholders reference metadata keys and are resolved to the corresponding `value` property, but only if the metadata entry's visibility level is appropriate for the current trust boundary. This approach supports both simple display scenarios and more sophisticated internationalization systems while preventing accidental exposure of sensitive information through message interpolation.

> **Note:** Error messages are not part of the API surface and may change without notice. Do not write application code with hard dependencies on error text.

### Error Information and Domain Context

The core identity of the error is provided through `domain`, `reason`, and `metadata` fields. This structure enables programmatic error handling while providing sufficient context for debugging:

- `domain`: A logical grouping that identifies the service or component generating the error (e.g., `com.myapp.iam`)
- `reason`: A specific error code within that domain (e.g., `INVALID_TOKEN`)
- `metadata`: Structured data providing additional context with granular visibility control

The combination of `domain` and `reason` provides context for programmatic handling. For example, a `NOT_FOUND` reason is generic, but when combined with a domain like `com.app.bank_transfer`, it becomes clear what kind of resource was not found.

Each metadata entry includes both a value and visibility level, allowing fine-grained control over what information is exposed across trust boundaries:

```json
{
  "domain": "com.app.bank_transfer",
  "reason": "NOT_FOUND",
  "metadata": {
    "transfer_id": {
      "value": "709b4d54-04ee-4e82-89a3-4bdf07462809",
      "visibility": "PUBLIC"
    },
    "user_account": {
      "value": "internal-acc-12345",
      "visibility": "PRIVATE"
    }
  }
}
```

### Error Composition and Batching

The `causes` field enables composition of multiple errors and error wrapping scenarios. In distributed systems, operations often fail for multiple reasons, or errors need additional context when propagating between services. The array structure supports:

- **Batch operations**: Reporting all errors that occurred during a batch process
- **Error wrapping**: Adding context to an error from a downstream service

**Nested Error Handling**: When errors contain nested `causes`, implementations should consider which information is relevant at each boundary:

- **Internal logging**: Preserve full error trees with all fields for debugging
- **API responses**: May simplify nested errors by removing redundant metadata, internal-only fields (`source_id`, `debug_info`), or even entire nested levels if they don't provide actionable information to the client
- **User interfaces**: Often focus on the top-level error context and primary cause, hiding implementation details from nested errors

The specification allows rich error composition while giving implementers flexibility to present appropriate levels of detail for different audiences.

### Visibility and Security Controls

The specification provides two levels of visibility control to handle different security scenarios:

#### Error-Level Visibility

The top-level `visibility` field determines whether the entire error should be exposed at a given trust boundary:

- `INTERNAL`: **Drop the entire error** at PRIVATE/PUBLIC boundaries. Log internally but return a generic error message to external callers.
- `PRIVATE`: **Show the error** within trusted organization boundaries, but drop it entirely at PUBLIC boundaries.
- `PUBLIC`: **Safe for any client** including end-users; the error structure can be transmitted to external systems.

#### Metadata-Level Visibility

Each metadata entry has its own `visibility` field that controls field-level exposure within errors that are allowed through:

- `INTERNAL`: Strip this metadata field when crossing PRIVATE/PUBLIC boundaries
- `PRIVATE`: Include in PRIVATE contexts, strip at PUBLIC boundaries
- `PUBLIC`: Safe to include at any boundary

#### Two-Tier Filtering Process

1. **First**: Check error-level visibility - if insufficient, drop entire error and return generic message
2. **Second**: For errors that pass the first check, filter individual metadata fields based on their visibility

This approach provides both coarse-grained control (drop sensitive errors entirely) and fine-grained control (selectively expose metadata within allowed errors).

#### Trust Boundary Guidelines

**INTERNAL Boundary:**

- Same process/service internal operations
- Database connections, internal APIs
- Development and staging environments
- Service-to-service within same security domain

**PRIVATE Boundary:**

- Cross-service within organization
- Internal APIs behind authentication
- Trusted partner integrations
- Multi-tenant shared infrastructure

**PUBLIC Boundary:**

- External client applications
- Third-party integrations
- Internet-facing APIs
- Untrusted or unknown consumers

**Edge Cases:**

- Service mesh proxies: Consider PRIVATE unless crossing organization boundary
- Load balancers: Inherit boundary from upstream service
- Multi-tenant systems: Each tenant represents separate boundary

### Validation and Input Handling

The `subject` field identifies the specific entity or element that caused the error, enabling precise feedback about invalid inputs. For validation errors, this can be a [JSON Pointer (RFC 6901)](https://datatracker.ietf.org/doc/html/rfc6901) indicating the specific field that failed validation.

Example validation error structure:

```typescript
// Full internal error structure (can contain all fields)
const internalError = {
  specversion: 1,
  code: Code.INVALID_ARGUMENT,
  message: 'Invalid payment request',
  domain: 'com.stripe.payments',
  reason: 'VALIDATION_FAILED',
  metadata: {
    request_id: { value: 'req-12345', visibility: Visibility.PRIVATE },
    payment_processor: { value: 'internal-gateway-v2', visibility: Visibility.INTERNAL },
  },
  causes: [
    {
      specversion: 1,
      code: Code.INVALID_ARGUMENT,
      message: 'Invalid currency code',
      subject: '/currency',
      domain: 'com.stripe.payments',
      reason: 'INVALID_CURRENCY',
      metadata: {
        supported_currencies: { value: 'USD,EUR,GBP', visibility: Visibility.PUBLIC },
        log_level: { value: 'WARN', visibility: Visibility.INTERNAL },
      },
      causes: [],
      visibility: Visibility.PUBLIC,
      source_id: 'ValidationService.ts:123',
    },
  ],
  visibility: Visibility.PUBLIC,
  subject: '/data',
  source_id: 'RequestHandler.ts:456',
  time: '2022-01-01T00:00:00Z',
};

// Simplified API response (strips unnecessary nested details and filters metadata by visibility)
const apiResponse = {
  code: Code.INVALID_ARGUMENT,
  message: 'Invalid payment request',
  domain: 'com.stripe.payments',
  reason: 'VALIDATION_FAILED',
  metadata: {}, // All metadata was PRIVATE/INTERNAL, so filtered out at PUBLIC boundary
  causes: [
    {
      // Note: specversion, source_id, time stripped from nested errors
      // Only essential validation info preserved, metadata filtered by visibility
      subject: '/currency',
      domain: 'com.stripe.payments',
      reason: 'INVALID_CURRENCY',
      metadata: {
        supported_currencies: { value: 'USD,EUR,GBP', visibility: Visibility.PUBLIC },
        // log_level filtered out at PUBLIC boundary
      },
    },
  ],
  subject: '/payment',
};
```

### Error Instance Identification

The `id` field provides a unique identifier for each specific error occurrence. This enables correlation of errors across distributed systems, facilitating debugging and support workflows. When users report issues, the error ID can be used to quickly locate relevant logs and trace the error's path through the system.

### Temporal Context

The `time` field captures when the error occurred, providing temporal context for debugging and analysis. In distributed systems where operations may be retried or processed out of order, timestamps help establish the sequence of events leading to failures.

The specification uses ISO 8601 timestamp format in UTC timezone for universal compatibility.

### Documentation and Help Resources

The `help` field provides links to relevant documentation that can assist users in resolving the error. Rather than embedding lengthy explanations in the error message, help links offer comprehensive guidance while keeping the error structure concise.

Help links must be absolute URLs that are publicly accessible without authentication for public services. The linked documentation must provide actionable steps to resolve the specific error.

### Development and Debugging Context

The `debug_info` field contains technical details intended solely for internal debugging purposes. This includes stack traces and detailed diagnostic information that helps developers identify root causes.

The debug information consists of:

- **Stack Entries**: Call stack frames showing the execution path leading to the error, typically including file names, method names, and line numbers
- **Detail**: Contextual information about what the system was attempting when the error occurred, such as database queries, timeout values, or other technical specifics

**Critical**: This information must be stripped when errors cross trust boundaries to prevent information leakage. Generate debug information conditionally based on error severity or type rather than automatically for every error.

### Localized User Communication

The `localized_message` field provides translated error messages for end-user consumption. This field should typically be populated at the application edge where the user's locale is known, rather than in core business logic. It enables user-friendly error presentation without requiring clients to implement their own translation systems.

### Retry Guidance

The `retry_info` field indicates when and how clients should retry failed operations. This prevents unnecessary load on failing systems while providing clear guidance on recovery strategies. The field supports both duration-based delays and absolute retry timestamps.

Duration values use ISO 8601 duration format and absolute timestamps use ISO 8601 format in UTC timezone.

### Source Code Traceability

The `source_id` field helps developers quickly locate the specific code location where an error was generated. This accelerates debugging by providing a direct reference to the error's origin, whether through file paths, method signatures, or custom identifiers.

**Security Note**: Be cautious about exposing detailed file paths or internal method signatures in `source_id` when errors cross trust boundaries. Consider using opaque identifiers or hash values for external-facing errors while maintaining detailed source information for internal debugging.

### Secure Metadata Handling

The new metadata structure with granular visibility control addresses the need for different levels of information disclosure across trust boundaries:

- **Granular Visibility Control**: Each metadata field has its own visibility level (`PUBLIC`, `PRIVATE`, `INTERNAL`), allowing precise control over information exposure
- **Automatic Filtering**: Implementations must filter metadata entries based on the current trust boundary, only including entries where `entry.visibility <= currentBoundary`
- **Principle of Least Information**: Set appropriate visibility levels - use `INTERNAL` for sensitive debugging data, `PRIVATE` for organizational context, and `PUBLIC` for client-safe information
- **Critical Security Risk**: The entire `debug_info` field (including both `stack_entries` and `detail`) contains sensitive internal information and must be completely stripped at trust boundaries
- **Regular Audits**: Periodically audit metadata visibility assignments and debug information for compliance with data protection policies

**Filtering Logic Example:**

- At `PUBLIC` boundary: Only expose metadata entries with `visibility: PUBLIC`
- At `PRIVATE` boundary: Expose `PUBLIC` and `PRIVATE` entries
- At `INTERNAL` boundary: Expose all metadata entries

### Error Boundary Processing

The Error specification defines a rich structure that errors _can_ generate internally, but implementations must apply appropriate two-tier filtering when crossing boundaries:

#### Tier 1: Error-Level Filtering

First, check the error's top-level `visibility` field:

- **INTERNAL errors**: At PRIVATE/PUBLIC boundaries, drop the entire error. Log internally and return a generic error like `{"code": "INTERNAL", "message": "An internal error occurred"}`
- **PRIVATE errors**: At PUBLIC boundaries, drop the entire error and return a generic error
- **PUBLIC errors**: Allow the error structure to proceed to Tier 2 filtering

#### Tier 2: Field-Level Filtering

For errors that pass Tier 1, apply field-level filtering:

- **Always strip**: `debug_info` at all external boundaries
- **Conditionally strip**: `source_id`, `time` based on trust level
- **Metadata filtering**: Remove metadata entries where `entry.visibility > currentBoundary`
- **Nested errors**: Apply both tiers recursively to `causes` array

#### Practical Examples

**Example 1: INTERNAL Error (Dropped Entirely)**

```typescript
// Internal database error
const internalError = {
  visibility: Visibility.INTERNAL,
  code: Code.INTERNAL,
  message: 'Database connection pool exhausted',
  domain: 'com.mybusiness.database',
  reason: 'CONNECTION_POOL_EXHAUSTED',
  metadata: {
    connection_string: { value: 'postgres://...', visibility: Visibility.INTERNAL },
  },
};

// At PUBLIC boundary: Entire error is dropped
const publicResponse = {
  code: Code.INTERNAL,
  message: 'An internal error occurred',
  // No metadata, no details - completely generic
};
```

**Example 2: PUBLIC Error (Metadata Filtered)**

```typescript
// Validation error that can be shown to clients
const validationError = {
  visibility: Visibility.PUBLIC, // Error passes Tier 1
  code: Code.INVALID_ARGUMENT,
  message: 'Invalid user data',
  domain: 'com.mybusiness.validation',
  reason: 'INVALID_FIELD',
  metadata: {
    field_name: { value: 'email', visibility: Visibility.PUBLIC },
    validation_rule: { value: 'EMAIL_FORMAT', visibility: Visibility.PRIVATE },
    internal_trace: { value: 'rule_engine_v2', visibility: Visibility.INTERNAL },
  },
};

// At PUBLIC boundary: Error shown, but metadata filtered
const publicResponse = {
  code: Code.INVALID_ARGUMENT,
  message: 'Invalid user data',
  domain: 'com.mybusiness.validation',
  reason: 'INVALID_FIELD',
  metadata: {
    field_name: { value: 'email', visibility: Visibility.PUBLIC },
    // validation_rule and internal_trace filtered out
  },
};
```

#### Boundary Examples

**Internal Systems**: Generate complete error information with all fields for comprehensive debugging.

**API Boundaries**:

- Apply two-tier filtering based on trust level
- Simplify nested errors by removing redundant metadata and internal-only fields from `causes`
- Preserve essential validation information while respecting visibility constraints

**Client Applications**: Present user-focused information, potentially flattening complex error hierarchies while preserving field-level validation details for form handling.

This two-tier approach balances comprehensive error generation capabilities with appropriate information disclosure for different consumption contexts.

## Resolution

The Error specification describes the following conceptual model:

> [!WARNING]
> **Language-Specific Implementation Note**: The TypeScript types below illustrate the conceptual error model, not literal implementation requirements. Each programming language should use its native, idiomatic types and naming conventions:
>
> - **Timestamp**: Use `time.Time` (Go), `DateTime` (Elixir), `datetime` (Python), `Date` (JavaScript), etc.
> - **Duration**: Use `time.Duration` (Go), `Duration` (Elixir), `timedelta` (Python), etc.
> - **Enums**: Use language-appropriate enum/constant definitions
> - **Records**: Use structs, classes, maps, or equivalent data structures
> - **Field Naming**: Use language conventions (e.g., `stack_entries` in Python/Go, `stackEntries` in JavaScript/Java, `StackEntries` in C#)
>
> The specification describes the semantic intent and relationships between error components - implementations should prioritize language conventions and type safety over literal TypeScript translation. This specification is not about wire format or serialization; those aspects are implementation-specific and will be addressed in future work.

- You **MUST** use UPPERCASE constant values for the `Code` and `Visibility` enums in SDK implementations, regardless of the programming language's typical naming conventions.
- You **MUST** maintain the exact constant names as defined in this specification (e.g., `INVALID_ARGUMENT`, `NOT_FOUND`, `INTERNAL`, `PRIVATE`, `PUBLIC`) to ensure consistent programmatic error handling across all SDKs.
- You **MUST** preserve both the string representation and integer values of constants as defined in this specification - the string names **MUST** be UPPERCASE and the integer values **MUST** match exactly (e.g., `INVALID_ARGUMENT = 3`, `NOT_FOUND = 5`).
- You **MAY** provide language-idiomatic aliases or wrapper functions for developers who prefer local conventions, but the canonical constant values **MUST** remain UPPERCASE with their corresponding integer values.

```typescript
type ErrorSpec = {
  specversion: SpecVersion;
  code: Code;
  message: MessageTemplate;
  domain: Domain;
  reason: Reason;
  metadata: Metadata;
  causes: ErrorSpec[];
  visibility: Visibility;

  // Optional Information
  subject?: Subject;
  id?: Id;
  time?: Time;
  help?: Help;
  debug_info?: DebugInfo;
  localized_message?: LocalizedMessage;
  retry_info?: RetryInfo;
  source_id?: SourceId;
};

/**
 * The version of the specification that the error uses.
 * Monotonically increasing version numbers are used to identify the evolution
 * of the error format. The version number is represented as a positive integer
 * starting from 1.
 *
 * Example: 1, 2, 3, etc.
 */
type SpecVersion = number;

/**
 * The canonical error codes for APIs.
 *
 * Sometimes multiple error codes may apply. Services should return
 * the most specific error code that applies. For example, prefer
 * `OUT_OF_RANGE` over `FAILED_PRECONDITION` if both codes apply.
 * Similarly prefer `NOT_FOUND` or `ALREADY_EXISTS` over `FAILED_PRECONDITION`.
 */
enum Code {
  /**
   * The operation was cancelled, typically by the caller.
   */
  CANCELLED = 1,

  /**
   * Unknown error. For example, this error may be returned when
   * a status value received from another address space belongs to
   * an error space that is not known in this address space. Also
   * errors raised by APIs that do not return enough error information
   * may be converted to this error.
   */
  UNKNOWN = 2,

  /**
   * The client specified an invalid argument. Note that this differs
   * from `FAILED_PRECONDITION`. `INVALID_ARGUMENT` indicates arguments
   * that are problematic regardless of the state of the system
   * (e.g., a malformed file name).
   */
  INVALID_ARGUMENT = 3,

  /**
   * The deadline expired before the operation could complete. For operations
   * that change the state of the system, this error may be returned
   * even if the operation has completed successfully. For example, a
   * successful response from a server could have been delayed long
   * enough for the deadline to expire.
   */
  DEADLINE_EXCEEDED = 4,

  /**
   * Some requested entity (e.g., file or directory) was not found.
   *
   * Note to server developers: if a request is denied for an entire class
   * of users, such as gradual feature rollout or undocumented whitelist,
   * `NOT_FOUND` may be used. If a request is denied for some users within
   * a class of users, such as user-based access control, `PERMISSION_DENIED`
   * must be used.
   */
  NOT_FOUND = 5,

  /**
   * The entity that a client attempted to create (e.g., file or directory)
   * already exists.
   */
  ALREADY_EXISTS = 6,

  /**
   * The caller does not have permission to execute the specified
   * operation. `PERMISSION_DENIED` must not be used for rejections
   * caused by exhausting some resource (use `RESOURCE_EXHAUSTED`
   * instead for those errors). `PERMISSION_DENIED` must not be
   * used if the caller cannot be identified (use `UNAUTHENTICATED`
   * instead for those errors). This error code does not imply the
   * request is valid or the requested entity exists or satisfies
   * other pre-conditions.
   */
  PERMISSION_DENIED = 7,

  /**
   * Some resource has been exhausted, perhaps a per-user quota, or
   * perhaps the entire file system is out of space.
   */
  RESOURCE_EXHAUSTED = 8,

  /**
   * The operation was rejected because the system is not in a state
   * required for the operation's execution. For example, the directory
   * to be deleted is non-empty, an rmdir operation is applied to
   * a non-directory, etc.
   *
   * Service implementors can use the following guidelines to decide
   * between `FAILED_PRECONDITION`, `ABORTED`, and `UNAVAILABLE`:
   *  (a) Use `UNAVAILABLE` if the client can retry just the failing call.
   *  (b) Use `ABORTED` if the client should retry at a higher level
   *      (e.g., when a client-specified test-and-set fails, indicating the
   *      client should restart a read-modify-write sequence).
   *  (c) Use `FAILED_PRECONDITION` if the client should not retry until
   *      the system state has been explicitly fixed. E.g., if an "rmdir"
   *      fails because the directory is non-empty, `FAILED_PRECONDITION`
   *      should be returned since the client should not retry unless
   *      the files are deleted from the directory.
   */
  FAILED_PRECONDITION = 9,

  /**
   * The operation was aborted, typically due to a concurrency issue such as
   * a sequencer check failure or transaction abort.
   *
   * See the guidelines above for deciding between `FAILED_PRECONDITION`,
   * `ABORTED`, and `UNAVAILABLE`.
   */
  ABORTED = 10,

  /**
   * The operation was attempted past the valid range. E.g., seeking or
   * reading past end-of-file.
   *
   * Unlike `INVALID_ARGUMENT`, this error indicates a problem that may
   * be fixed if the system state changes. For example, a 32-bit file
   * system will generate `INVALID_ARGUMENT` if asked to read at an
   * offset that is not in the range [0,2^32-1], but it will generate
   * `OUT_OF_RANGE` if asked to read from an offset past the current
   * file size.
   *
   * There is a fair bit of overlap between `FAILED_PRECONDITION` and
   * `OUT_OF_RANGE`. We recommend using `OUT_OF_RANGE` (the more specific
   * error) when it applies so that callers who are iterating through
   * a space can easily look for an `OUT_OF_RANGE` error to detect when
   * they are done.
   */
  OUT_OF_RANGE = 11,

  /**
   * The operation is not implemented or is not supported/enabled in this
   * service.
   */
  UNIMPLEMENTED = 12,

  /**
   * Internal errors. This means that some invariants expected by the
   * underlying system have been broken. This error code is reserved
   * for serious errors.
   */
  INTERNAL = 13,

  /**
   * The service is currently unavailable. This is most likely a
   * transient condition, which can be corrected by retrying with
   * a backoff. Note that it is not always safe to retry
   * non-idempotent operations.
   *
   * See the guidelines above for deciding between `FAILED_PRECONDITION`,
   * `ABORTED`, and `UNAVAILABLE`.
   */
  UNAVAILABLE = 14,

  /**
   * Unrecoverable data loss or corruption.
   */
  DATA_LOSS = 15,

  /**
   * The request does not have valid authentication credentials for the
   * operation.
   */
  UNAUTHENTICATED = 16,
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
 * Messages MAY use {placeholders} that reference metadata keys. During message
 * rendering, placeholders are replaced with the corresponding metadata value,
 * but only if the metadata entry's visibility level is appropriate for the
 * current trust boundary.
 *
 * Example: "Transfer {transfer_id} not found" where transfer_id references
 * metadata.transfer_id.value, but only if transfer_id has sufficient
 * visibility for the current boundary.
 */
type MessageTemplate = string;

/**
 * The reason of the error. This is a constant value that identifies the
 * proximate cause of the error. Error reasons are unique within a particular
 * domain of errors.
 */
type Reason = string;

/**
 * The logical grouping to which the "reason" belongs. The error domain is
 * typically the registered service name of the tool or product that generates
 * the error. Example: "pubsub.googleapis.com". If the error is generated by
 * some common infrastructure, the error domain must be a globally unique value
 * that identifies the infrastructure. For Google API infrastructure, the error
 * domain is "googleapis.com".
 */
type Domain = string;

/**
 * A metadata entry containing both the value and its visibility level.
 * This allows fine-grained control over which metadata fields are exposed
 * across different trust boundaries.
 *
 * Note: The MetadataValue is designed as an extensible object structure to
 * accommodate future enhancements such as data classification tags (e.g., GDPR,
 * PII), retention policies, or encryption requirements. For
 * simplicity, the current specification includes only `value` and `visibility`
 * fields, but the object structure enables backward-compatible extensions.
 */
type MetadataValue = {
  /**
   * The actual metadata value. While currently constrained to string values
   * for serialization compatibility, implementers should structure data
   * appropriately (e.g., JSON stringify complex objects).
   */
  value: string;

  /**
   * The visibility level of this metadata entry. Determines whether this
   * specific field should be exposed based on the current trust boundary.
   */
  visibility: Visibility;
};

/**
 * Additional structured details about this error. Each metadata entry includes
 * its value and visibility level, allowing granular control over what information
 * is exposed across different trust boundaries. See the "Secure Metadata Handling"
 * section for detailed guidance.
 */
type Metadata = Record<string, MetadataValue>;

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

/**
 * Subject identifies the specific entity or element that caused the error
 * within the context defined by `info.domain`. This provides a granular
 * pointer to the root of the problem, whether it originates from user input,
 * service-to-service communication, or an internal process.
 *
 * For example, when validating a message payload, the `subject` can be a
 * [JSON Pointer (RFC 6901)](https://datatracker.ietf.org/doc/html/rfc6901) indicating the field that failed validation, such as `/data/email`. In other cases, it might be an application-specific identifier for a resource, like a user ID or transaction ID.
 *
 * This enables precise, programmatic error handling, allowing a client to
 * highlight an invalid field in a UI or a backend service to trigger specific
 * compensation logic.
 */
type Subject = string;

/**
 * ID identifies the error. The combination of info + id is unique for each
 * distinct error event. Consumers MAY assume that error events with identical
 * source and id are duplicates. This ID can be provided to support teams as a
 * reference to help identify and track specific error occurrences, enabling
 * faster troubleshooting and resolution of issues.
 */
type Id = string;

/**
 * Time timestamp of when the occurrence happened.
 */
type Time = Timestamp;

type HelpLink = {
  /**
   * Describes what the link offers. Must be plain text suitable for a hyperlink.
   *
   * Example: "How to fix authentication token errors"
   */
  description: string;

  /**
   * The URL of the link. Must be an absolute URL with a scheme and publicly
   * accessible without authentication for public services. The linked
   * documentation must provide actionable steps to resolve the specific error.
   *
   * Examples:
   * - "https://docs.example.com/auth/token-renewal"
   * - "https://console.example.com/quotas" (for quota exceeded errors)
   * - "https://status.example.com" (for service availability issues)
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
   * Each entry represents a frame in the call stack, typically showing
   * the file, method, and line number where the error occurred.
   */
  stack_entries: string[];

  /**
   * Additional diagnostic information about the error.
   * This field provides context-specific details that can help with debugging,
   * such as query information, timeout values, or other technical details
   * about what the system was attempting to do when the error occurred.
   */
  detail: string;
};

/**
 * Provides a localized error message that is safe to return to the user which
 * can be attached to an RPC error.
 */
type LocalizedMessage = {
  /**
   * The locale follows [BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).
   * Examples: "en-US", "fr-CH", "es-MX"
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
 * Servers **MUST** set either `retry_offset` or `retry_time`—never both—to
 * guide client backoff.
 */
type RetryInfo = RetryDuration | RetryTime;

/**
 * An opaque value that helps pinpoint the location in the code where the error
 * was constructed. While not guaranteed to be unique, it ideally provides a
 * stable reference to the error's origin.
 *
 * Examples:
 * - File and line: "UserService.ts:142"
 * - Method signature: "com.myapp.UserService.validateUser"
 * - Error site hash: "usr_val_001"
 */
type SourceId = string;

/**
 * Timestamp represents a point in time using ISO 8601 format in UTC timezone.
 *
 * Note: Implementations should use native date/time types in their programming
 * language (e.g., time.Time in Go, DateTime in C#, Date in JavaScript) and
 * serialize to ISO 8601 strings for transport. For Protocol Buffers,
 * use google.protobuf.Timestamp.
 *
 * Examples: "2023-01-01T12:30:45Z", "2023-01-01T12:30:45.123Z"
 */
type Timestamp = string;

/**
 * Duration represents a span of time using ISO 8601 duration format.
 *
 * Note: Implementations should use native duration types in their programming
 * language (e.g., time.Duration in Go, TimeSpan in C#, number in JavaScript)
 * and serialize to ISO 8601 duration strings for transport. For Protocol Buffers,
 * use google.protobuf.Duration.
 *
 * Examples: "PT30S" (30 seconds), "PT5M" (5 minutes), "P1D" (1 day)
 */
type Duration = string;
```

## Consequences

### Positive Consequences

- **Improved Error Correlation**: Consistent error identifiers enable better tracing across distributed systems
- **Enhanced Debugging**: Rich metadata and source information accelerate troubleshooting
- **Better Observability**: Structured error data integrates seamlessly with monitoring and alerting systems
- **Consistent User Experience**: Standardized error handling provides predictable client behavior
- **Security by Design**: Granular visibility controls prevent sensitive information leakage
- **Simplified Integration**: Common error format reduces translation overhead between services

### Negative Consequences

- **Larger Payloads**: Additional metadata increases message size compared to simple error strings
- **Implementation Complexity**: Error filtering and visibility management require careful initial implementation, though this is typically a one-time effort that benefits the entire organization.
- **Learning Curve**: Teams need to understand visibility boundaries and metadata structuring
- **Potential Over-Engineering**: Risk of adding unnecessary complexity for simple error scenarios

## Extra

### Google RPC Compatibility

This specification is designed to be compatible with Google RPC error handling patterns while providing additional flexibility for modern distributed systems. When integrating with Google APIs or systems that use the [Google RPC error model](https://github.com/googleapis/googleapis/tree/master/google/rpc), consider the following compatibility notes:

### Core Compatibility

The Error specification aligns closely with Google RPC's error structure:

- `domain` and `reason` map directly to Google RPC's `ErrorInfo.domain` and `ErrorInfo.reason`
- `metadata` corresponds to Google RPC's `ErrorInfo.metadata`
- `help` field structure matches Google RPC's `Help` message with `links` array
- `debug_info` aligns with Google RPC's `DebugInfo` for internal debugging
- `localized_message` matches Google RPC's `LocalizedMessage` structure

### Retry Information Differences

**Important Caveat**: Google RPC's `RetryInfo` only supports duration-based delays, not absolute timestamps:

```protobuf
// Google RPC RetryInfo (duration-only)
message RetryInfo {
  google.protobuf.Duration retry_delay = 1;
}
```

**Compatibility Strategy**: When interfacing with Google APIs or systems expecting Google RPC format:

1. **Use only `RetryDuration` variant** of our `RetryInfo` union type
2. **Map `retry_offset` to `retry_delay`** when converting to Google RPC format
3. **Ignore `RetryTime` variant** - Google RPC cannot express absolute retry timestamps

### Additional Considerations

- **`code` field**: Maps to Google RPC status codes but provides more granular HTTP-compatible values
- **`visibility` field**: No direct equivalent in Google RPC; handle visibility filtering in the conversion layer
- **`source_id` and `time` fields**: Google RPC extensions; include these in custom detail messages when needed
- **`subject` field**: Use Google RPC's `BadRequest.FieldViolation` for field-level validation errors

## Recognitions

- Anthony Accomazzo [@acco](https://github.com/acco)
- Dallas Hall [@dallashall](https://github.com/dallashall)
- George Avgoustis [@Return-1](https://github.com/Return-1)
- Germain Cassiere [@germainc](https://github.com/germainc)
- Jon Skeet [@jskeet](https://github.com/jskeet)
- Manu Phatak [@manuphatak](https://github.com/manuphatak)
- Matt Sutkowski [@msutkowski](https://github.com/msutkowski)
- Noah Dietz [@noahdietz](https://github.com/noahdietz)
- Sean Callan [@doomspork](https://github.com/doomspork)
- Zach Bruhnke [@zbruhnke](https://github.com/zbruhnke)

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
- <https://developers.google.com/webmaster-tools/v1/errors>
