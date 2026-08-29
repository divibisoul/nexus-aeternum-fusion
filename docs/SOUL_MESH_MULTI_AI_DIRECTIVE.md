# Soul Mesh — Multi-IA Operating Directive

N01–N06 are independent AI nuclei. Each nucleus owns its identity, agents, capabilities, runtime, tools and execution logic. Soul Mesh is the interoperability layer between them.

This directive is cumulative: it does not cancel existing Mesh protocols, transports, routes, runtimes, tests or security controls.

Every nucleus must support, using its existing architecture:

1. Mesh ingress — receive and validate a message addressed to it.
2. Identity — expose an unambiguous N01–N06 identity.
3. Agents/capabilities — advertise executable local capabilities and their owning runtime/agent.
4. Mesh egress — request work from another nucleus through the existing Mesh transport abstraction, not a parallel inter-IA API.
5. Response — return success, failure or partial result.
6. Discovery — discover nuclei and available capabilities.
7. Delegation — delegate work when another nucleus owns the required capability.
8. Correlation — preserve request/conversation/correlation context across hops.

A real operation is:

discovery -> identity/handshake -> authorization -> request -> capability resolution -> local agent/runtime execution -> response -> correlation/trace propagation

A health endpoint or placeholder `status: ok` is not proof of IA-to-IA execution.

For delegation, preserve the logical task correlation ID while identifying the current target/hop. The receiving nucleus authorizes and executes its own capability; it must not impersonate another nucleus.

Distributed telemetry should follow the existing Soul Mesh correlation model and OpenTelemetry context-propagation/messaging concepts so producer and consumer execution can be correlated across process/network/transport boundaries without exposing secrets.

Implementation rule: whenever an audit finds that a nucleus cannot receive a real request, resolve one of its own capabilities, execute it, return the result, or delegate through Mesh, fix the missing implementation immediately using the existing architecture before continuing.
