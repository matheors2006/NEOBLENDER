# System Design Document (SDD)
## Web-Based 3D Jewelry Modeler

| | |
|---|---|
| **Document Owner** | Engineering |
| **Status** | Draft v1.0 |
| **Last Updated** | 2026-09-17 |
| **Audience** | Engineering team, technical stakeholders |

---

## 1. Executive Summary

This document describes the technical architecture for a web-based, real-time 3D jewelry modeling application. The platform allows designers to construct, edit, and visualize parametric jewelry models (rings, pendants, earrings, and similar items) directly in the browser, with server-side geometry processing for computationally expensive operations (boolean operations, mesh repair, gemstone placement validation, and manufacturability checks such as wall-thickness analysis).

The system is composed of a React/TypeScript single-page application rendering 3D scenes via React Three Fiber (R3F), a FastAPI backend exposing both REST and WebSocket APIs, a Python-based geometry processing layer built on Trimesh, and a PostgreSQL database for persistence.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- Provide real-time, low-latency 3D editing of jewelry meshes in the browser.
- Offload heavy geometry computation (CSG/boolean operations, mesh validation, volume/weight estimation) to a scalable backend service.
- Support persistent, versioned projects that can be saved, reloaded, and shared.
- Maintain a consistent, synchronized mesh state between client and server during collaborative or long-running operations.
- Establish a foundation that can later support multi-user real-time collaboration.

### 2.2 Non-Goals (for the initial release)
- Full multi-user simultaneous editing (Operational Transform / CRDT-based collaboration) — architecture should not preclude it, but it is out of scope for v1.
- Native desktop or mobile applications.
- Physical 3D printing slicing/G-code generation.
- Full CAD-grade parametric history (undo tree is sufficient; not a full feature-based history like SolidWorks).

---

## 3. System Architecture Overview

### 3.1 High-Level Architecture

The system follows a **client-server architecture** with two parallel communication channels between the frontend and backend:

1. **REST (HTTP/JSON)** — used for stateless, transactional operations: authentication, project CRUD, asset uploads, and file exports.
2. **WebSocket (persistent, bidirectional)** — used for stateful, low-latency, session-scoped operations: live mesh editing commands, incremental geometry updates, processing job progress, and (future) multi-user presence.

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                       │
│                                                                   │
│  ┌───────────────┐   ┌───────────────────┐   ┌────────────────┐ │
│  │   React UI      │   │  React Three Fiber │   │  Zustand Store  │ │
│  │  (panels, tools)│◄─►│  (3D Scene/Canvas)  │◄─►│ (client state)  │ │
│  └───────────────┘   └───────────────────┘   └────────────────┘ │
│           ▲                                          ▲            │
│           │                                          │            │
│           │            WebSocket Client (persistent)  │           │
│           │            REST Client (fetch/axios)      │           │
└───────────┼──────────────────────────────────────────┼───────────┘
            │                                          │
            │  HTTPS (REST)          WSS (WebSocket)   │
            ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (FastAPI)                          │
│                                                                    │
│  ┌───────────────┐   ┌────────────────────┐  ┌──────────────────┐│
│  │  REST Routers   │   │ WebSocket Connection│  │  Auth / JWT      ││
│  │ (projects, auth,│   │      Manager         │  │   Middleware     ││
│  │  export, users) │   │ (per-session state)  │  │                  ││
│  └───────┬───────┘   └──────────┬─────────┘  └──────────────────┘│
│          │                       │                                 │
│          ▼                       ▼                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Geometry Processing Service (Python)            │   │
│  │   Trimesh: boolean ops, repair, volume/weight, validation     │   │
│  │   (executed via background workers / process pool)            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │      PostgreSQL           │
                        │  (users, projects,        │
                        │   mesh state, versions,   │
                        │   materials, gemstones)   │
                        └─────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   Object Storage (S3 /    │
                        │   local disk, dev only)   │
                        │   Mesh binaries (.glb),   │
                        │   thumbnails, exports      │
                        └─────────────────────────┘
```

### 3.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| **React UI** | Renders panels, toolbars, property inspectors, layers list, and material/gemstone pickers. Dispatches user intents (e.g., "extrude", "add gemstone") to the Zustand store and WebSocket client. |
| **React Three Fiber** | Declarative 3D scene graph. Renders the live mesh, gizmos, cameras, lighting, and selection highlighting. Subscribes to Zustand for scene state. |
| **Zustand Store** | Single source of truth for client-side application state: current tool, selection, transient transform state, viewport settings, and the "optimistic" local copy of mesh state. |
| **WebSocket Client** | Maintains a persistent connection to the backend for the active editing session. Sends edit commands, receives authoritative mesh deltas and job status updates. |
| **FastAPI REST Layer** | Handles authentication, project lifecycle (create/list/rename/delete), file import/export, and any operation that does not require sub-second round-trip latency. |
| **FastAPI WebSocket Layer** | Manages one connection (and associated session state) per active editing client. Routes incoming edit events to the geometry processing service and broadcasts results back to the client (and, in the future, to collaborators). |
| **Geometry Processing Service** | Wraps Trimesh to perform boolean operations (union/difference/intersection for prong settings, engraving, hollowing), mesh repair/validation, volume and estimated metal weight calculation, and manufacturability checks (minimum wall thickness). Executed off the main event loop via a process pool or task queue to avoid blocking the WebSocket server. |
| **PostgreSQL** | Persists relational data: users, projects, project versions/snapshots, materials, and gemstone catalogs. Large binary mesh data is stored in object storage, with PostgreSQL holding references (URLs/keys) and metadata. |
| **Object Storage** | Stores binary mesh files (glTF/GLB, STL, OBJ), rendered thumbnails, and exported manufacturing files. |

### 3.3 Communication Model

**Why two channels instead of one?**

- REST is well-suited to idempotent, cacheable, infrequent operations (login, list projects, export STL) where standard HTTP semantics (status codes, caching, retries) are valuable.
- WebSockets are required for the core editing loop: each user interaction (drag a vertex, adjust a ring size, apply a boolean cut) may require server-side recomputation via Trimesh, and the result must be streamed back with minimal latency to feel interactive. A persistent connection avoids the overhead of repeated HTTP handshakes and enables the server to push unsolicited messages (e.g., "processing job complete", "mesh validation failed").

**Session lifecycle:**

1. Client authenticates via REST (`POST /api/v1/auth/login`), receiving a JWT.
2. Client loads a project via REST (`GET /api/v1/projects/{id}`), which returns the current mesh state reference and metadata.
3. Client opens a WebSocket connection to `/ws/projects/{id}`, authenticating with the JWT (passed as a query parameter or subprotocol header, since browsers do not support custom WebSocket headers).
4. The server's **Connection Manager** registers the session, associates it with the project, and sends an initial `sync_state` message.
5. All subsequent edit operations flow through the WebSocket until the client disconnects or the session ends. Periodic checkpoints are persisted to PostgreSQL/object storage as project version snapshots.

---

## 4. Data Models

Data models are presented conceptually here; the canonical schema lives in SQLAlchemy models and Pydantic schemas in the backend codebase.

### 4.1 User

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String, unique | Login identifier |
| `hashed_password` | String | Bcrypt/Argon2 hash |
| `display_name` | String | |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |
| `role` | Enum (`designer`, `admin`) | Authorization tier |

### 4.2 Project

Represents a single jewelry design (e.g., "Solitaire Engagement Ring – v3").

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `owner_id` | UUID (FK → User) | |
| `name` | String | |
| `description` | Text, nullable | |
| `current_version_id` | UUID (FK → ProjectVersion), nullable | Pointer to the latest saved snapshot |
| `thumbnail_url` | String, nullable | Rendered preview for the dashboard |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |
| `is_archived` | Boolean | Soft delete |

### 4.3 ProjectVersion (Mesh State Snapshot)

Represents an immutable, saved snapshot of the mesh and scene graph at a point in time. Supports undo history and version comparison.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `project_id` | UUID (FK → Project) | |
| `parent_version_id` | UUID, nullable | Enables a version tree (branching for "what-if" variants) |
| `mesh_uri` | String | Object storage key for the binary mesh (GLB) |
| `scene_graph` | JSONB | Serialized node hierarchy (see §4.4) |
| `metadata` | JSONB | Computed metrics: volume (mm³), estimated weight per material, bounding box, triangle count |
| `created_by` | UUID (FK → User) | |
| `created_at` | Timestamp | |
| `label` | String, nullable | Optional user-facing checkpoint name (e.g., "Before resizing") |

### 4.4 Scene Graph Node (embedded JSONB structure)

Rather than a fully relational scene graph, nodes are stored as a JSONB tree within `ProjectVersion.scene_graph` for flexibility and read performance, with indexed relational tables for entities that require querying (e.g., gemstones, for catalog/inventory reporting).

```json
{
  "id": "node_uuid",
  "type": "band | head | prong | gemstone | engraving | custom_mesh",
  "name": "Ring Band",
  "transform": {
    "position": [0, 0, 0],
    "rotation": [0, 0, 0, 1],
    "scale": [1, 1, 1]
  },
  "geometry_ref": "band_primitive_v2",
  "material_id": "material_uuid",
  "parameters": {
    "diameter_mm": 18.2,
    "band_width_mm": 2.1,
    "profile": "comfort_fit"
  },
  "children": []
}
```

### 4.5 Material

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | e.g., "18k Yellow Gold" |
| `density_g_cm3` | Float | Used for weight estimation |
| `base_color` | String (hex) | Fallback render color |
| `pbr_texture_uri` | String, nullable | Physically-based rendering texture set |
| `finish_type` | Enum (`polished`, `matte`, `hammered`, `brushed`) | |

### 4.6 Gemstone

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `project_version_id` | UUID (FK → ProjectVersion) | |
| `scene_node_id` | String | Reference to the node within `scene_graph` |
| `stone_type` | Enum (`diamond`, `sapphire`, `ruby`, `emerald`, `custom`) | |
| `cut` | Enum (`round`, `princess`, `oval`, `emerald`, `pear`, `cushion`) | |
| `carat_weight` | Float | |
| `clarity_grade` | String, nullable | |
| `color_grade` | String, nullable | |
| `position` | JSONB | Local transform relative to parent setting |

### 4.7 ProcessingJob

Tracks asynchronous, server-side geometry operations dispatched over WebSocket.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `project_id` | UUID (FK → Project) | |
| `session_id` | String | WebSocket connection/session identifier |
| `job_type` | Enum (`boolean_op`, `mesh_repair`, `validate_manufacturability`, `export`) | |
| `status` | Enum (`queued`, `running`, `completed`, `failed`) | |
| `input_payload` | JSONB | |
| `result_payload` | JSONB, nullable | |
| `error_message` | Text, nullable | |
| `created_at` / `completed_at` | Timestamp | |

### 4.8 Entity-Relationship Summary

```
User (1) ──< (N) Project
Project (1) ──< (N) ProjectVersion
ProjectVersion (1) ──< (N) Gemstone
ProjectVersion (N) >── (1) Material   [via node-level material_id references]
Project (1) ──< (N) ProcessingJob
```

---

## 5. API Design

### 5.1 REST Endpoints

Base path: `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Authenticate, returns JWT access + refresh tokens |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token |
| `GET` | `/users/me` | Retrieve the current authenticated user's profile |
| `GET` | `/projects` | List projects owned by the current user (paginated) |
| `POST` | `/projects` | Create a new project (initializes an empty scene graph) |
| `GET` | `/projects/{project_id}` | Retrieve project metadata + current version reference |
| `PATCH` | `/projects/{project_id}` | Rename / update description / archive |
| `DELETE` | `/projects/{project_id}` | Soft-delete a project |
| `GET` | `/projects/{project_id}/versions` | List saved version snapshots |
| `GET` | `/projects/{project_id}/versions/{version_id}` | Retrieve a specific snapshot (scene graph + metadata) |
| `POST` | `/projects/{project_id}/versions/{version_id}/restore` | Restore an older version as the current one |
| `POST` | `/projects/{project_id}/export` | Trigger export (STL/OBJ/GLB) for 3D printing or CAD interchange; returns a signed download URL |
| `GET` | `/materials` | List available materials catalog |
| `GET` | `/gemstones/catalog` | List available gemstone cut/type presets |

**Conventions:**
- All requests/responses use JSON with `snake_case` keys.
- Authentication via `Authorization: Bearer <jwt>` header.
- Standard HTTP status codes; errors follow a consistent envelope:
  ```json
  { "error": { "code": "PROJECT_NOT_FOUND", "message": "Project does not exist or access is denied." } }
  ```
- Pagination via `limit`/`offset` query parameters, with `total_count` in the response.

### 5.2 WebSocket Protocol

**Endpoint:** `wss://<host>/ws/projects/{project_id}?token=<jwt>`

The WebSocket protocol uses a single connection per client session, multiplexing all editing traffic through typed JSON envelope messages:

```json
{
  "type": "<event_type>",
  "request_id": "client_generated_uuid",
  "timestamp": "2026-09-17T14:32:00Z",
  "payload": { }
}
```

`request_id` allows the client to correlate asynchronous server responses (e.g., job completions) with the originating request.

#### 5.2.1 Client → Server Events

| Event Type | Payload | Description |
|---|---|---|
| `sync_request` | `{}` | Requests a full authoritative state resync (used on reconnect) |
| `node_transform` | `{ node_id, position, rotation, scale }` | Live transform update (translate/rotate/scale) for a scene node; low-latency, no server-side geometry recompute required |
| `node_add` | `{ parent_id, node_type, parameters }` | Adds a new primitive/component (e.g., new prong, gemstone) |
| `node_update_params` | `{ node_id, parameters }` | Updates parametric properties (e.g., band diameter), triggers geometry regeneration |
| `node_delete` | `{ node_id }` | Removes a node and its children |
| `boolean_operation` | `{ operation: "union"|"difference"|"intersection", target_ids: [...], tool_id }` | Requests a CSG operation via Trimesh, processed asynchronously as a `ProcessingJob` |
| `validate_manufacturability` | `{ material_id }` | Requests wall-thickness, volume, and printability checks |
| `save_version` | `{ label? }` | Persists the current session state as a new `ProjectVersion` |
| `cursor_update` | `{ position, camera_orientation }` | (Future) presence broadcast for multi-user collaboration |

#### 5.2.2 Server → Client Events

| Event Type | Payload | Description |
|---|---|---|
| `sync_state` | `{ scene_graph, metadata }` | Full authoritative scene state, sent on connect/reconnect |
| `node_updated` | `{ node_id, mesh_delta | full_node }` | Broadcasts a confirmed node change (echoed to sender for reconciliation, and to collaborators in future multi-user mode) |
| `job_queued` | `{ job_id, request_id, job_type }` | Acknowledges a long-running operation has been queued |
| `job_progress` | `{ job_id, percent }` | Optional progress updates for long-running Trimesh operations |
| `job_completed` | `{ job_id, request_id, result: { mesh_uri | scene_graph_patch } }` | Delivers the result of an asynchronous geometry operation |
| `job_failed` | `{ job_id, request_id, error_message }` | Reports failure (e.g., non-manifold mesh, invalid boolean operation) |
| `version_saved` | `{ version_id, created_at }` | Confirms a snapshot was persisted |
| `error` | `{ code, message }` | Protocol-level or authorization errors |

#### 5.2.3 Optimistic Updates & Reconciliation

For low-latency operations (`node_transform`), the client applies changes optimistically to its local Zustand state and renders immediately via R3F. The server validates and rebroadcasts the confirmed state via `node_updated`; the client reconciles by replacing its optimistic value with the authoritative one, which is a no-op in the common case where they match.

For heavy operations (`boolean_operation`, `validate_manufacturability`), the client shows a loading/pending state on the affected node until `job_completed` or `job_failed` is received — these are not optimistic, since Trimesh computation is required to determine the resulting geometry.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Latency** | Transform updates (`node_transform`) should round-trip in < 100ms on a broadband connection. Boolean operations should complete in < 3s for meshes under 50k triangles. |
| **Scalability** | WebSocket connection manager must support horizontal scaling; sessions should be routable via a shared backing store (e.g., Redis) rather than in-process memory once beyond a single server instance. |
| **Reliability** | Client must handle WebSocket disconnects gracefully with automatic reconnect + `sync_request` to recover authoritative state. |
| **Data Integrity** | Every destructive geometry operation (boolean difference, delete) must be recoverable via version history. |
| **Security** | All endpoints require authentication except registration/login. WebSocket connections validate JWT before accepting the upgrade. Object storage URLs are signed and time-limited. |
| **Portability** | Exported meshes (STL/OBJ/GLB) must be manufacturer-agnostic and validated as watertight/manifold before export. |

---

## 7. Technology Stack Summary

| Layer | Technology | Rationale |
|---|---|---|
| Frontend UI | React + TypeScript | Type safety, component ecosystem, team familiarity |
| 3D Rendering | React Three Fiber (Three.js) | Declarative scene graph that integrates naturally with React's component model and state updates |
| Client State | Zustand | Minimal boilerplate, selector-based subscriptions that pair well with R3F's render loop, avoids unnecessary re-renders compared to heavier state libraries |
| Backend Framework | FastAPI | Native async support (critical for WebSocket concurrency), automatic OpenAPI schema generation, Pydantic validation |
| Real-Time Transport | WebSockets (native FastAPI/Starlette support) | Persistent, bidirectional, low-overhead channel required for interactive editing |
| Geometry Processing | Trimesh (Python) | Mature library for mesh I/O, boolean operations, repair, and analysis; integrates with `scipy`/`numpy` ecosystem |
| Database | PostgreSQL | Strong relational integrity for users/projects/versions; native JSONB support for flexible scene-graph storage |
| Object Storage | S3-compatible storage | Binary mesh assets do not belong in the relational database; enables CDN-backed delivery of thumbnails/exports |

---

## 8. Implementation Phases

### Phase 0 — Foundations (Weeks 1–2)
- Repository setup, CI/CD pipeline, linting/formatting (ESLint/Prettier, Ruff/Black).
- FastAPI project scaffold with health-check endpoint, PostgreSQL connection via SQLAlchemy, Alembic migrations.
- React + TypeScript + Vite scaffold with R3F canvas rendering a static placeholder mesh.
- Authentication: user registration/login, JWT issuance and validation.

### Phase 1 — Core Viewer & Project Persistence (Weeks 3–5)
- Data models and migrations for `User`, `Project`, `ProjectVersion`.
- REST endpoints for project CRUD and version retrieval.
- R3F scene graph renderer capable of loading a GLB mesh from a signed URL and rendering it with orbit controls.
- Zustand store scaffolding: scene state, selection state, tool state.
- Basic scene graph editor UI: outliner panel, transform gizmo (translate/rotate/scale) for selected nodes.

### Phase 2 — Real-Time Editing Loop (Weeks 6–9)
- WebSocket Connection Manager on the backend (per-project session registry).
- Client WebSocket hook (`useProjectSocket`) integrated with Zustand for optimistic updates.
- Implement `node_transform`, `node_add`, `node_update_params`, `node_delete` events end-to-end.
- Reconnect logic with `sync_request`/`sync_state`.

### Phase 3 — Geometry Processing Engine (Weeks 10–14)
- Integrate Trimesh-based processing service: boolean operations (union/difference/intersection), mesh repair, watertightness validation.
- Asynchronous job execution via a process pool (e.g., `concurrent.futures.ProcessPoolExecutor` or a task queue such as Celery/Arq backed by Redis) to keep the WebSocket event loop responsive.
- Implement `boolean_operation`, `job_queued`, `job_progress`, `job_completed`, `job_failed` protocol events.
- Volume and estimated weight calculation per selected material.

### Phase 4 — Materials, Gemstones & Manufacturability (Weeks 15–18)
- `Material` and `Gemstone` data models, catalog endpoints, and UI pickers.
- PBR material rendering in R3F (texture loading, roughness/metalness mapping for realistic metal previews).
- Gemstone placement tooling (snap-to-prong, cut/carat selection).
- `validate_manufacturability` job: minimum wall thickness analysis, non-manifold detection, printability report UI.

### Phase 5 — Version History & Export (Weeks 19–21)
- Version snapshot save/restore UI (`save_version`, version tree browsing, diff/compare thumbnails).
- Export pipeline: STL/OBJ/GLB generation with pre-export validation, signed download URLs.
- Undo/redo built atop the version snapshot mechanism for the current session.

### Phase 6 — Hardening & Scale Preparation (Weeks 22–24)
- Load testing of the WebSocket layer; introduce Redis-backed session/connection registry for multi-instance deployment.
- Observability: structured logging, metrics (connection counts, job durations, job failure rates), error tracking.
- Security review: rate limiting, input validation on all WebSocket payloads, signed URL expiry audit.
- Documentation and onboarding guide for future contributors.

### Phase 7 — Future Considerations (Post-v1, not scheduled)
- Multi-user real-time collaboration (CRDT or OT-based conflict resolution for `scene_graph`).
- Server-side rendering of high-fidelity ray-traced previews for marketing/catalog images.
- Plugin architecture for custom parametric components (e.g., third-party prong/setting libraries).

---

## 9. Open Questions

- **Conflict resolution strategy** for future multi-user editing: last-write-wins per node vs. full CRDT — deferred to Phase 7 design work.
- **Job queue technology choice** (in-process process pool vs. Celery/Arq with Redis) should be revisited based on Phase 3 load testing results.
- **Mesh format for scene graph primitives**: whether primitives (band, prong, head) are generated procedurally on both client (preview) and server (authoritative), or server-only with client displaying a lower-fidelity proxy while awaiting confirmation — impacts perceived latency and is worth a short technical spike before Phase 2 begins in earnest.
