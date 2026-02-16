# The Places (Geo-Organizer)
[Русский версия](README.ru.md)

[User manual](MANUAL.md)

**v6.3.3 alpha** A personal service for managing geomarks, routes, and photo albums.  
**Demo:** [places.scrofa-tridens.ru](https://places.scrofa-tridens.ru)

## Description

“**The Places**” is a feature-rich SPA for structuring personal geographic data, a personal GIS platform. The service allows creating a hierarchical folder structure, building complex routes, and attaching photo albums to locations. The project focuses on data usability and high interface speed, combining the flexibility of a tree hierarchy with the strictness of a relational data model.

![UI: Distance measurement mode](public/raw/places-screenshot-1.png)

![UI: Routes mode](public/raw/places-screenshot-2.png)

## Core Features

- **Hierarchical Structure:** Organization of folders and locations with infinite nesting.
- **Advanced Drag-and-Drop:** Intuitive sorting of all entities (folders, points, routes, photos) with smart insertion logic.
- **Navigation and Odometry:** Dynamic calculation of route length, including logical “hops” between point groups.
- **Photo Management:** Full-featured photo albums for locations, routes, and individual points with content sorting capabilities.
- **Import/Export:** Support for GPX and JSON formats for synchronization with other systems.
- **Instant Search:** Filtering the entire database by titles and descriptions.

## Architectural Advantages

#### 1. Atomic Data Model (The “Point” Concept)
The system is based on the principle of separating geometry from metadata. 
- **Point Entity:** A basic “atom” with 3D coordinates (lat, lon, alt). 
- **Place/Route Entities:** Act as information shells referencing a `Point`.
This approach allows reusing the same physical point in different contexts (e.g., as a standalone Place and as part of several Routes simultaneously), ensuring data integrity and eliminating duplication.

#### 2. High-Performance Batch Processing (Dirty Tracking)
The state management system based on **Pinia** implements a “dirty flags” mechanism (`added`, `updated`, `deleted`). This allows:
- Accumulating changes locally within a session.
- Performing batch synchronization with the server on demand (Batch Save).
- Ensuring the operation of the Snapshot system to prevent data loss.

#### 3. Optimized Drag-and-Drop Interface
A custom reordering system is implemented. The technical highlight is the use of **CSS positioning zones** (`area_top` / `area_bottom`), which offloads the insertion point calculation from JavaScript to browser rendering, ensuring 60 FPS smoothness even in deep hierarchies.

## Tech Stack

- **Frontend:** Vue 3 (Composition API), TypeScript (Strict Mode), Pinia.
- **Backend:** PHP 8. Database performance is achieved by using **binary UUIDs (binary(16))** for primary and foreign keys, optimizing indexing and search.
- **Maps:** Hybrid use of Yandex.Maps API and OpenStreetMap.
- **Data Flow:** Modular architecture with business logic extracted into `shared` utilities.

## Installation and Deployment

1.  **Clone:** `git clone ...`
2.  **Database:** Create a MySQL database and import the schema from `/mezzanine/db_places.sql`.
3.  **Configuration:** Edit `/src/shared/constants.js` and `/backend/config.php`.
4.  **Permissions:** Ensure `/dist/uploads/images/` subdirectories (big, small, and their orphaned counterparts) are writable.
5.  **Cron:** Set up a cron job for `/backend/dist/cron.php` to clean up orphaned images and points.
6.  **Build:**
    ```bash
    npm install
    npm run build
    ```
7.  **Server:** Point your web server root to the `/dist` directory.
