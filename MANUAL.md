# The Places
Version: 6.3.3 alpha

- [1. Purpose](#1-purpose)
- [2. System Concept](#2-system-concept)
	- [Point (Point)](#point-point)
	- [Place (Place)](#place-place)
	- [Route (Route)](#route-route)
	- [Folder (Folder)](#folder-folder)
	- [Images (Images)](#images-images)
	- [Independent Points](#independent-points)
	- [Active Points](#active-points)
- [3. Operating Modes](#3-operating-modes)
	- [3.1 Normal Mode](#31-normal-mode)
	- [3.2 Route Mode](#32-route-mode)
	- [3.3 Ruler Mode](#33-ruler-mode)
- [4. Interface](#4-interface)
	- [4.1 Top Panel (Header)](#41-top-panel-header)
		- [4.1.1 Left-Top Area — Toggle Buttons](#411-left-top-area--toggle-buttons)
		- [4.1.2 Right-Top Area — System Buttons](#412-right-top-area--system-buttons)
		- [4.1.3 Center Area](#413-center-area)
	- [4.2 Main Area](#42-main-area)
		- [4.2.1 Left Panel — Hierarchy and Structure](#421-left-panel--hierarchy-and-structure)
		- [4.2.2 Right Panel — Content and Editing](#422-right-panel--content-and-editing)
		- [4.2.3 Center — The Map](#423-center--the-map)
	- [4.3 Bottom Panel (Footer)](#43-bottom-panel-footer)
		- [4.3.1 Left side](#431-left-side)
		- [4.3.2 Right side](#432-right-side)
- [5. Storage and Ordering Principles](#5-storage-and-ordering-principles)
- [6. Basic Workflow](#6-basic-workflow)
	- [Creating a Place](#creating-a-place)
	- [Creating a Route](#creating-a-route)
	- [Working with Images](#working-with-images)
- [7. Architectural Features](#7-architectural-features)
	- [Deletion and Data Safety](#deletion-and-data-safety)
	- [Saving Principle](#saving-principle)
- [8. Current Status](#8-current-status)

## 1. Purpose

**The Places** is a GeoOrganizer. It is a personal GIS — a tool for systematizing personal geographic data.

It is not a social network.
It is not a "map with pins."
It is not a movement tracker.

It is a tool for meaningful storage and organization of spatial information. You are not just managing markers on a map. You are managing and structuring your own collections of geographic points, associated places, routes, and related materials into a unified logical model.

**Example**:
A riverside bar where you occasionally meet friends.
You can save the point itself on the map, add a description and photos, and then include it in a route for an evening stroll.

## 2. System Concept

The core of “The Places” lies in the separation of entities. There are only four:

* **Point**
* **Place**
* **Route**
* **Folder**

If you understand the difference between them, you understand the system.

### Point (Point)

Geographic coordinates (latitude, longitude, altitude).
These are pure spatial data without description.

A Point consists of specific geographic coordinates: latitude, longitude, and altitude. Plus its own unique identifier — an ID.

Nothing more. It doesn't "belong" to a place or a route. It isn't even aware of them.
It exists on its own.

Each Place is linked to one Point.
Routes consist of a sequence of Points.

The main principle:
**One Point — one geography. It can be reused multiple times.**

### Place (Place)

**Semantic description of a Point.** It contains: a name, text description, images, and a link to one specific Point. Plus a lot of other additional optional information you might want to add.

When a Place is created, the system automatically creates a new Point and "links" this Place to it. This technical detail is hidden from the user to simplify the interface. The **Place itself does not store geographic coordinates**. It is the meaning, the meta-description of a specific location in your life, which naturally has its own geography (the Point).

**Example**:
"The gazebo where we first kissed Masha."
You can save this place (already with a Point on the map), add a description and photos, and then include it in a "nostalgic evening stroll" route. Technically, when you include a Place in a route, it is the associated Point that is added, not the Place itself.

### Route (Route)

**An ordered sequence of Points.**
Features:

* The same Point can be included in a Route multiple times.
* A Route doesn't copy coordinates; it stores links to existing Points.
* The order of Points matters.

This allows for building both linear routes and repetitive movement scenarios.

**Example**:
"Friday evening stroll."
You start from home (the Point linked to the "My Home" Place), go to a shop (Point), then a library (Point), wander through the park, and on the way back stop by the same library again (the same Point) before returning home.

### Folder (Folder)

**A hierarchical structure for organizing Places and Routes.**
Each folder can contain:

* Multiple Places or Routes.
* Other nested folders.

A tree model is supported, maintaining the order of elements.

Technically, **a Folder does not "contain" other Folders**. The entire hierarchy is built on the "parent link" principle. Each folder has a Parent ID. The same applies to Places and Routes. A regular user doesn't need to worry about this.

### Images (Images)

**Photo album for a Place or a Route.**
An ordered list of images you have uploaded.

* Drag & Drop is supported to change the display order of previews.
* The display order is updated and stored in the database based on a sorting index.
* Clicking a preview opens the image in full-screen mode with the ability to scroll through the album.

### Independent Points

Temporary markers — a tool for planning.

* Not saved in the database; exist only in the current session.
* Can be converted into permanent entities (planned feature).

### Active Points

There are "current" (active) entities in the system: Place, Route, Point.
Active markers are displayed in green. Activity for Places and Routes is independent.

## 3. Operating Modes

The system has three modes: **Normal**, **Routes**, and **Ruler**.
The mode determines the map behavior and Right-Click (RMB) actions.

### 3.1 Normal Mode

Working with Places and temporary Points.

* RMB on empty space: Creates a Point.
* RMB on an existing Point: Shows coordinate information.

### 3.2 Route Mode

Working with the current Route.

* RMB on empty space or an existing Point: Adds it to the end of the route.

### 3.3 Ruler Mode

A service route for measuring distances.

* Not saved in the database.
* Allows you to quickly find the distance of a path without creating a permanent Route.

## 4. Interface

The application interface is divided into functional zones.

### 4.1 Top Panel (Header)

The header contains the main controls and settings.

#### 4.1.1 Left-Top Area — Toggle Buttons

* **Places**: Toggle the visibility of the Places layer on the map.
* **Routes**: Toggle the visibility of the Routes layer on the map.
* **Points**: Toggle the visibility of the Points layer on the map.
* **Radius**: Utility for circular area selection.
* **Folder Names**: Toggle the display of folder names directly on the map.
* **Mode Switcher**: Selection between **Normal**, **Route**, and **Ruler** (measuring) modes.

#### 4.1.2 Right-Top Area — System Buttons

* **Undo / Redo**: Buttons to revert or repeat the last actions performed in the current session.
* **Save**: The most important button. It initiates the batch synchronization of all changes made in the current session with the database.
* **PWA / Install**: Button to install “The Places” as a standalone application on your device.
* **Export / Import**: Tools for working with external data formats (**GPX**, **JSON**).
* **Help**: Opens this manual.
* **Logout**: End the current session.

#### 4.1.3 Center Area

* **Profile**: Link to account settings (password change, e-mail management, account deletion).
* **Language**: Toggle between **RU** (Russian) and **EN** (English).
* **Theme**: Switch between **Dark** and **Light** interface themes.

### 4.2 Main Area

#### 4.2.1 Left Panel — Hierarchy and Structure

* **Search**: Quick search for entities by name.
* **Radius Control**: Settings for the radius utility.
* **Ruler Points**: List of points for the current measurement in Ruler mode.
* **Folders Tree**: The main navigation tool through the hierarchy. Each folder has:
* **Visibility Eye**: Toggle visibility for the folder's content on the map.
* **Plus (+)**: Add a Place, Route, or Subfolder inside this folder.
* **Delete (X)**: Remove the folder. When deleting, you can choose to transfer its content to the parent folder.

#### 4.2.2 Right Panel — Content and Editing

* Appears only when a specific entity (Place or Route) is selected.
* **Input Fields**: Name, description, external links.
* **Coordinates**: Display and manual editing of the Point's location.
* **System Fields**: Sorting index (`srt`) and the "Public" flag (visible to everyone or private).
* **Photo Album**: Section for uploading and managing images.

#### 4.2.3 Center — The Map

Interactive area powered by **OpenStreetMap** or **Yandex Maps**. Displays all active and visible entities.

### 4.3 Bottom Panel (Footer)

#### 4.3.1 Left side

**Show Own / Show All**: Independent toggle buttons to show only your markers/routes or all public data available in the system.

#### 4.3.2 Right side

* Dropdown to select the map engine (**OSM**, **Yandex**).
* Real-time display of the coordinates of the map center.

## 5. Storage and Ordering Principles

**Data vs. Order**: Elements are stored by ID. Display order is determined by the `srt` field. This ensures stability during synchronization and independence from JS object ordering.

**Explicit Saving**: An "offline-first" / "deferred saving" model. Changes are marked as "dirty" and sent to the server only when the "Save" button is clicked. This provides control over transactions and allows for batch updates.

## 6. Basic Workflow

### Creating a Place

1. Add a Place (into a folder or after another item).
2. Fill in the data in the right panel.
3. Add photos.
4. Save.

### Creating a Route

1. Create a Route in the left column.
2. Fill it with points via RMB on the map or buttons in the list.
3. Adjust the order in the right panel if necessary by dragging Point buttons in their list.
4. Save.

A Point can be added multiple times — the system does not create duplicates.

### Working with Images

* Upload new images via the "Add Photos" button.
* Use Drag & Drop to change the preview order.
* The order is also synchronized with the database.

## 7. Architectural Features

* **Frontend**: Vue 3, Pinia, Axios.
* Centralized state.
* Frontend data model mirrors the database structure.
* Batch synchronization of changes.

The system is designed with scalability and data consistency in mind.

### Deletion and Data Safety

If you delete a Place or a Point from a Route:

* If the corresponding Point is no longer used anywhere else, it is deleted.
* If it is still in use, it remains in the database.

### Saving Principle

All changes (addition, modification, deletion) are first accumulated in memory.
Only clicking the "Save" button in the top right writes them to the database.

This allows you to:

* Work fast.
* Undo actions.
* Control the moment of data commitment.

## 8. Current Status

Version 6.3.3 alpha.

Main functionality is stable:

* Entity creation and editing.
* Hierarchical organization.
* Routes with ordered points.
* Image sorting.
* Batch saving.
