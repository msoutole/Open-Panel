# Code Review: Docker Service Refactor

## Target Files:
*   `apps/api/src/services/docker.ts`
*   `apps/api/src/errors/docker.errors.ts`
*   `apps/api/src/lib/docker-utils.ts`
*   `apps/api/src/__tests__/services/docker.test.ts`

## 🛡️ Security Audit
*   No new critical security vulnerabilities introduced. The changes focus on error handling and code structure, not sensitive data handling or authentication.
*   *Recommendation:* Continue to follow secure coding practices.

## 🐛 Logic & Correctness
*   [ ] **[Minor]** **Docker connection fallback logic may mask initial connection issues.**
    *   *Location:* `apps/api/src/services/docker.ts:40-52` (`public constructor`)
    *   *Why:* The `try...catch` blocks around `new Docker()` calls only catch synchronous errors during instantiation. A non-functional Docker daemon (e.g., socket exists but daemon is down) might not throw an error until the first API call (like `ping()`). This could lead to the `DockerService` being instantiated with an unusable `this.docker` instance, causing later method calls to fail unexpectedly.
    *   *Recommendation:* Consider introducing an `initialize` method or moving the initial `ping()` call into the constructor's `else` block (where `this.docker` is first assigned) and wrapping it in a `try...catch` to proactively test the connection, throwing a `DockerConnectionError` if `ping()` fails. This ensures a functional `Docker` instance upon successful construction.

*   [ ] **[Minor]** **Inconsistent error handling for `getContainer` vs. other operations.**
    *   *Location:* `apps/api/src/services/docker.ts:135` (`async getContainer`)
    *   *Why:* The `getContainer` method explicitly returns `null` if a container is not found (`statusCode === 404`). However, most other Docker operations (e.g., `startContainer`, `stopContainer`) will internally try to `getContainer` and then operate on it. If `getContainer` returns `null`, subsequent operations on the `null` result will lead to `null` pointer exceptions or unexpected behavior in calling code. It's generally more consistent and robust to throw a specific `ContainerNotFoundError` directly from `getContainer` when a 404 occurs. This forces callers to explicitly handle the "not found" scenario.
    *   *Recommendation:* Modify `getContainer` to throw `new ContainerNotFoundError(dockerId)` when `statusCode === 404`. Consequently, update any internal or external callers of `getContainer` to catch this specific error, ensuring consistent and explicit error handling.

*   [ ] **[Minor]** **Potential ambiguity in `ImageOperationError` for `pullImage`.**
    *   *Location:* `apps/api/src/services/docker.ts:430, 436` (`async pullImage`)
    *   *Why:* The `pullImage` method correctly uses `new ImageOperationError('pull', image, err)`. However, the `ImageOperationError` constructor is defined as taking an `imageId`. While `image` (e.g., `nginx:latest`) is a valid identifier for an image, the parameter name `imageId` might strictly imply a Docker image ID hash. This is not a functional bug but a minor naming inconsistency.
    *   *Recommendation:* Consider renaming the `imageId` parameter in `ImageOperationError` to a more generic `resourceIdentifier` or `imageNameOrId` to better reflect its usage across different image operations (pull, remove).

## ♻️ Maintainability & Style
*   [ ] **[Nit]** **Verbosity in `streamContainerLogs` options type casting.**
    *   *Location:* `apps/api/src/services/docker.ts:384` (`streamContainerLogs`)
    *   *Why:* The expression `(as Parameters<Docker.Container['logs']>[0])` is technically correct for type casting, but it's verbose and can reduce readability.
    *   *Recommendation:* Define a dedicated interface for the options object in `streamContainerLogs` (e.g., `StreamLogOptions`), similar to how options are defined for `getContainerLogs`. This would improve clarity and maintainability.

*   [ ] **[Nit]** **Unused `DockerConnectionOptions` interface.**
    *   *Location:* `apps/api/src/services/docker.ts:16-20`
    *   *Why:* The `DockerConnectionOptions` interface is declared but not directly used as a type for any parameter within the `DockerService` class. While it might serve as documentation, its presence without direct application can be misleading.
    *   *Recommendation:* If the interface is purely for documentation, consider adding a comment explicitly stating this, or remove it if it's not intended for type enforcement. Alternatively, refactor the `DockerService` constructor to accept an object conforming to `DockerConnectionOptions` to leverage its type definition.

*   [ ] **[Minor]** **Reliance on `@ts-ignore` in unit tests.**
    *   *Location:* Throughout `apps/api/src/__tests__/services/docker.test.ts` (e.g., lines 35, 102, 137, 166, 185)
    *   *Why:* The use of `@ts-ignore` (and implicit `as any` from `vi.mocked` if not fully typed) can hide legitimate type mismatches and reduce the robustness of tests. While mocking complex external libraries often requires some level of type coercion, it's beneficial to minimize it. The current test mocks `PrismaClient` by creating a minimal mock object for `prisma.container` but doesn't fully type it, leading to the `@ts-ignore` warnings when assigning `dockerService.prisma`.
    *   *Recommendation:* Create more explicit and strongly typed mock objects for `PrismaClient` and `Dockerode` (or the relevant parts of them) that match the interfaces expected by `DockerService`. This would allow `vitest` to enforce type safety in the mock setup, leading to more reliable tests.

## ⚡ Performance
*   No new obvious performance bottlenecks introduced. The changes are primarily structural and error handling, not algorithmic.
*   *Recommendation:* Continue monitoring performance characteristics in the broader application.

## 💡 Commendations
*   **Improved Error Handling**: The introduction of custom error classes (`DockerError`, `DockerConnectionError`, `ContainerOperationError`, `ImageOperationError`) is a significant improvement. It provides more context-specific errors, allowing calling code to handle different failure modes precisely and enhancing debugging.
*   **Separation of Concerns**: The extraction of Docker utility functions (`mapDockerStatus`, `parseMemoryLimit`, `parseCpuLimit`) into `apps/api/src/lib/docker-utils.ts` is an excellent step towards modularity. It makes the `DockerService` class more focused on its core responsibility (orchestrating Docker operations and database interactions) and reduces its cognitive load.
*   **Enhanced Testability**: Refactoring the `DockerService` constructor to accept injected `Docker` and `PrismaClient` instances greatly improves its testability. This allows for isolated unit testing without relying on global singletons or actual external dependencies.
*   **Consistent Logging**: The consistent use of `logError` in conjunction with the new custom errors ensures that all significant failures are properly logged, aiding in monitoring and troubleshooting.

## 🏁 Final Verdict
**Request Changes**