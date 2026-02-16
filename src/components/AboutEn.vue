<template>
	<div class="popup-text about" @click.stop>
		<h1 id="manual-top">The Places</h1>
		<p>Version: 6.3.3 alpha</p>
		<ol>
			<li><a href="#1-purpose">Purpose</a></li>
			<li><a href="#2-system-concept">System Concept</a>
				<ol>
					<li><a href="#point-point">Point (Point)</a></li>
					<li><a href="#place-place">Place (Place)</a></li>
					<li><a href="#route-route">Route (Route)</a></li>
					<li><a href="#folder-folder">Folder (Folder)</a></li>
					<li><a href="#images-images">Images (Images)</a></li>
					<li><a href="#independent-points">Independent Points</a></li>
					<li><a href="#active-points">Active Points</a></li>
				</ol>
			</li>
			<li><a href="#3-operating-modes">Operating Modes</a>
				<ol>
					<li><a href="#31-normal-mode">Normal Mode</a></li>
					<li><a href="#32-route-mode">Route Mode</a></li>
					<li><a href="#33-ruler-mode">Ruler Mode</a></li>
				</ol>
			</li>
			<li><a href="#4-interface">Interface</a>
				<ol>
					<li><a href="#41-top-panel-header">Top Panel (Header)</a>
						<ol>
							<li><a href="#411-left-top-area--toggle-buttons">Left-Top Area — Toggle Buttons</a></li>
							<li><a href="#412-right-top-area--system-buttons">Right-Top Area — System Buttons</a></li>
							<li><a href="#413-center-area">Center Area</a></li>
						</ol>
					</li>
					<li><a href="#42-main-area">Main Area</a>
						<ol>
							<li><a href="#421-left-panel--hierarchy-and-structure">Left Panel — Hierarchy and
									Structure</a></li>
							<li><a href="#422-right-panel--content-and-editing">Right Panel — Content and Editing</a></li>
							<li><a href="#423-center--the-map">Center — The Map</a></li>
						</ol>
					</li>
					<li><a href="#43-bottom-panel-footer">Bottom Panel (Footer)</a>
						<ol>
							<li><a href="#431-left-side">Left side</a></li>
							<li><a href="#432-right-side">Right side</a></li>
						</ol>
					</li>
				</ol>
			</li>
			<li><a href="#5-storage-and-ordering-principles">Storage and Ordering Principles</a></li>
			<li><a href="#6-basic-workflow">Basic Workflow</a>
				<ol>
					<li><a href="#creating-a-place">Creating a Place</a></li>
					<li><a href="#creating-a-route">Creating a Route</a></li>
					<li><a href="#working-with-images">Working with Images</a></li>
				</ol>
			</li>
			<li><a href="#7-architectural-features">Architectural Features</a>
				<ol>
					<li><a href="#deletion-and-data-safety">Deletion and Data Safety</a></li>
					<li><a href="#saving-principle">Saving Principle</a></li>
				</ol>
			</li>
			<li><a href="#8-current-status">Current Status</a></li>
		</ol>
		<h2 id="1-purpose">1. Purpose</h2>
		<p><strong>Places</strong> is a GeoOrganizer. It is a personal GIS — a tool for systematizing personal geographic data.
		</p>
		<p>It is not a social network.
			It is not a “map with pins.”
			It is not a movement tracker.</p>
		<p>It is a tool for meaningful storage and organization of spatial information. You are not just managing markers on a
			map. You are managing and structuring your own collections of geographic points, associated places, routes, and
			related materials into a unified logical model.</p>
		<p><strong>Example</strong>:
			A riverside bar where you occasionally meet friends.
			You can save the point itself on the map, add a description and photos, and then include it in a route for an
			evening stroll.</p>
		<h2 id="2-system-concept">2. System Concept</h2>
		<p>The core of “The Places” lies in the separation of entities. There are only four:</p>
		<ul>
			<li><strong>Point</strong></li>
			<li><strong>Place</strong></li>
			<li><strong>Route</strong></li>
			<li><strong>Folder</strong></li>
		</ul>
		<p>If you understand the difference between them, you understand the system.</p>
		<h3 id="point-point">Point (Point)</h3>
		<p>Geographic coordinates (latitude, longitude, altitude).
			These are pure spatial data without description.</p>
		<p>A Point consists of specific geographic coordinates: latitude, longitude, and altitude. Plus its own unique
			identifier — an ID.</p>
		<p>Nothing more. It doesn't “belong” to a place or a route. It isn't even aware of them.
			It exists on its own.</p>
		<p>Each Place is linked to one Point.
			Routes consist of a sequence of Points.</p>
		<p>The main principle:
			<strong>One Point — one geography. It can be reused multiple times.</strong>
		</p>
		<h3 id="place-place">Place (Place)</h3>
		<p><strong>Semantic description of a Point.</strong> It contains: a name, text description, images, and a link to one
			specific Point. Plus a lot of other additional optional information you might want to add.</p>
		<p>When a Place is created, the system automatically creates a new Point and “links” this Place to it. This
			technical detail is hidden from the user to simplify the interface. The <strong>Place itself does not store
				geographic coordinates</strong>. It is the meaning, the meta-description of a specific location in your life,
			which naturally has its own geography (the Point).</p>
		<p><strong>Example</strong>:
			“The gazebo where we first kissed Masha.”
			You can save this place (already with a Point on the map), add a description and photos, and then include it in a
			“nostalgic evening stroll” route. Technically, when you include a Place in a route, it is the associated
			Point that is added, not the Place itself.</p>
		<h3 id="route-route">Route (Route)</h3>
		<p><strong>An ordered sequence of Points.</strong>
			Features:</p>
		<ul>
			<li>The same Point can be included in a Route multiple times.</li>
			<li>A Route doesn't copy coordinates; it stores links to existing Points.</li>
			<li>The order of Points matters.</li>
		</ul>
		<p>This allows for building both linear routes and repetitive movement scenarios.</p>
		<p><strong>Example</strong>:
			“Friday evening stroll.”
			You start from home (the Point linked to the “My Home” Place), go to a shop (Point), then a library
			(Point), wander through the park, and on the way back stop by the same library again (the same Point) before
			returning home.</p>
		<h3 id="folder-folder">Folder (Folder)</h3>
		<p><strong>A hierarchical structure for organizing Places and Routes.</strong>
			Each folder can contain:</p>
		<ul>
			<li>Multiple Places or Routes.</li>
			<li>Other nested folders.</li>
		</ul>
		<p>A tree model is supported, maintaining the order of elements.</p>
		<p>Technically, <strong>a Folder does not “contain” other Folders</strong>. The entire hierarchy is built on
			the “parent link” principle. Each folder has a Parent ID. The same applies to Places and Routes. A regular
			user doesn't need to worry about this.</p>
		<h3 id="images-images">Images (Images)</h3>
		<p><strong>Photo album for a Place or a Route.</strong>
			An ordered list of images you have uploaded.</p>
		<ul>
			<li>Drag & Drop is supported to change the display order of previews.</li>
			<li>The display order is updated and stored in the database based on a sorting index.</li>
			<li>Clicking a preview opens the image in full-screen mode with the ability to scroll through the album.</li>
		</ul>
		<h3 id="independent-points">Independent Points</h3>
		<p>Temporary markers — a tool for planning.</p>
		<ul>
			<li>Not saved in the database; exist only in the current session.</li>
			<li>Can be converted into permanent entities (planned feature).</li>
		</ul>
		<h3 id="active-points">Active Points</h3>
		<p>There are “current” (active) entities in the system: Place, Route, Point.
			Active markers are displayed in green. Activity for Places and Routes is independent.</p>
		<h2 id="3-operating-modes">3. Operating Modes</h2>
		<p>The system has three modes: <strong>Normal</strong>, <strong>Routes</strong>, and <strong>Ruler</strong>.
			The mode determines the map behavior and Right-Click (RMB) actions.</p>
		<h3 id="31-normal-mode">3.1 Normal Mode</h3>
		<p>Working with Places and temporary Points.</p>
		<ul>
			<li>RMB on empty space: Creates a Point.</li>
			<li>RMB on an existing Point: Shows coordinate information.</li>
		</ul>
		<h3 id="32-route-mode">3.2 Route Mode</h3>
		<p>Working with the current Route.</p>
		<ul>
			<li>RMB on empty space or an existing Point: Adds it to the end of the route.</li>
		</ul>
		<h3 id="33-ruler-mode">3.3 Ruler Mode</h3>
		<p>A service route for measuring distances.</p>
		<ul>
			<li>Not saved in the database.</li>
			<li>Allows you to quickly find the distance of a path without creating a permanent Route.</li>
		</ul>
		<h2 id="4-interface">4. Interface</h2>
		<p>The application interface is divided into functional zones.</p>
		<h3 id="41-top-panel-header">4.1 Top Panel (Header)</h3>
		<p>The header contains the main controls and settings.</p>
		<h4 id="411-left-top-area--toggle-buttons">4.1.1 Left-Top Area — Toggle Buttons</h4>
		<ul>
			<li><strong>Places</strong>: Toggle the visibility of the Places layer on the map.</li>
			<li><strong>Routes</strong>: Toggle the visibility of the Routes layer on the map.</li>
			<li><strong>Points</strong>: Toggle the visibility of the Points layer on the map.</li>
			<li><strong>Radius</strong>: Utility for circular area selection.</li>
			<li><strong>Folder Names</strong>: Toggle the display of folder names directly on the map.</li>
			<li><strong>Mode Switcher</strong>: Selection between <strong>Normal</strong>, <strong>Route</strong>, and
				<strong>Ruler</strong> (measuring) modes.</li>
		</ul>
		<h4 id="412-right-top-area--system-buttons">4.1.2 Right-Top Area — System Buttons</h4>
		<ul>
			<li><strong>Undo / Redo</strong>: Buttons to revert or repeat the last actions performed in the current session.
			</li>
			<li><strong>Save</strong>: The most important button. It initiates the batch synchronization of all changes made in
				the current session with the database.</li>
			<li><strong>PWA / Install</strong>: Button to install “The Places” as a standalone application on your device.
			</li>
			<li><strong>Export / Import</strong>: Tools for working with external data formats (<strong>GPX</strong>,
				<strong>JSON</strong>).</li>
			<li><strong>Help</strong>: Opens this manual.</li>
			<li><strong>Logout</strong>: End the current session.</li>
		</ul>
		<h4 id="413-center-area">4.1.3 Center Area</h4>
		<ul>
			<li><strong>Profile</strong>: Link to account settings (password change, e-mail management, account deletion).</li>
			<li><strong>Language</strong>: Toggle between <strong>RU</strong> (Russian) and <strong>EN</strong> (English).</li>
			<li><strong>Theme</strong>: Switch between <strong>Dark</strong> and <strong>Light</strong> interface themes.</li>
		</ul>
		<h3 id="42-main-area">4.2 Main Area</h3>
		<h4 id="421-left-panel--hierarchy-and-structure">4.2.1 Left Panel — Hierarchy and Structure</h4>
		<ul>
			<li><strong>Search</strong>: Quick search for entities by name.</li>
			<li><strong>Radius Control</strong>: Settings for the radius utility.</li>
			<li><strong>Ruler Points</strong>: List of points for the current measurement in Ruler mode.</li>
			<li><strong>Folders Tree</strong>: The main navigation tool through the hierarchy. Each folder has:</li>
			<li><strong>Visibility Eye</strong>: Toggle visibility for the folder's content on the map.</li>
			<li><strong>Plus (+)</strong>: Add a Place, Route, or Subfolder inside this folder.</li>
			<li><strong>Delete (X)</strong>: Remove the folder. When deleting, you can choose to transfer its content to the
				parent folder.</li>
		</ul>
		<h4 id="422-right-panel--content-and-editing">4.2.2 Right Panel — Content and Editing</h4>
		<ul>
			<li>Appears only when a specific entity (Place or Route) is selected.</li>
			<li><strong>Input Fields</strong>: Name, description, external links.</li>
			<li><strong>Coordinates</strong>: Display and manual editing of the Point's location.</li>
			<li><strong>System Fields</strong>: Sorting index (<code>srt</code>) and the “Public” flag (visible to
				everyone or private).</li>
			<li><strong>Photo Album</strong>: Section for uploading and managing images.</li>
		</ul>
		<h4 id="423-center--the-map">4.2.3 Center — The Map</h4>
		<p>Interactive area powered by <strong>OpenStreetMap</strong> or <strong>Yandex Maps</strong>. Displays all active and
			visible entities.</p>
		<h3 id="43-bottom-panel-footer">4.3 Bottom Panel (Footer)</h3>
		<h4 id="431-left-side">4.3.1 Left side</h4>
		<p><strong>Show Own / Show All</strong>: Independent toggle buttons to show only your markers/routes or all public data
			available in the system.</p>
		<h4 id="432-right-side">4.3.2 Right side</h4>
		<ul>
			<li>Dropdown to select the map engine (<strong>OSM</strong>, <strong>Yandex</strong>).</li>
			<li>Real-time display of the coordinates of the map center.</li>
		</ul>
		<h2 id="5-storage-and-ordering-principles">5. Storage and Ordering Principles</h2>
		<p><strong>Data vs. Order</strong>: Elements are stored by ID. Display order is determined by the <code>srt</code>
			field. This ensures stability during synchronization and independence from JS object ordering.</p>
		<p><strong>Explicit Saving</strong>: An “offline-first” / “deferred saving” model. Changes are
			marked as “dirty” and sent to the server only when the “Save” button is clicked. This provides
			control over transactions and allows for batch updates.</p>
		<h2 id="6-basic-workflow">6. Basic Workflow</h2>
		<h3 id="creating-a-place">Creating a Place</h3>
		<ol>
			<li>Add a Place (into a folder or after another item).</li>
			<li>Fill in the data in the right panel.</li>
			<li>Add photos.</li>
			<li>Save.</li>
		</ol>
		<h3 id="creating-a-route">Creating a Route</h3>
		<ol>
			<li>Create a Route in the left column.</li>
			<li>Fill it with points via RMB on the map or buttons in the list.</li>
			<li>Adjust the order in the right panel if necessary by dragging Point buttons in their list.</li>
			<li>Save.</li>
		</ol>
		<p>A Point can be added multiple times — the system does not create duplicates.</p>
		<h3 id="working-with-images">Working with Images</h3>
		<ul>
			<li>Upload new images via the “Add Photos” button.</li>
			<li>Use Drag & Drop to change the preview order.</li>
			<li>The order is also synchronized with the database.</li>
		</ul>
		<h2 id="7-architectural-features">7. Architectural Features</h2>
		<ul>
			<li><strong>Frontend</strong>: Vue 3, Pinia, Axios.</li>
			<li>Centralized state.</li>
			<li>Frontend data model mirrors the database structure.</li>
			<li>Batch synchronization of changes.</li>
		</ul>
		<p>The system is designed with scalability and data consistency in mind.</p>
		<h3 id="deletion-and-data-safety">Deletion and Data Safety</h3>
		<p>If you delete a Place or a Point from a Route:</p>
		<ul>
			<li>If the corresponding Point is no longer used anywhere else, it is deleted.</li>
			<li>If it is still in use, it remains in the database.</li>
		</ul>
		<h3 id="saving-principle">Saving Principle</h3>
		<p>All changes (addition, modification, deletion) are first accumulated in memory.
			Only clicking the “Save” button in the top right writes them to the database.</p>
		<p>This allows you to:</p>
		<ul>
			<li>Work fast.</li>
			<li>Undo actions.</li>
			<li>Control the moment of data commitment.</li>
		</ul>
		<h2 id="8-current-status">8. Current Status</h2>
		<p>Version 6.3.3 alpha.</p>
		<p>Main functionality is stable:</p>
		<ul>
			<li>Entity creation and editing.</li>
			<li>Hierarchical organization.</li>
			<li>Routes with ordered points.</li>
			<li>Image sorting.</li>
			<li>Batch saving.</li>
		</ul>
		<p><a href="#manual-top">Up</a></p>
	</div>
</template>

<style lang="scss" scoped>
ol {
	list-style-type: none;
	counter-reset: item;
}

li {
	display: block;
}

li::before {
	content: counters(item, ".") ". ";
	counter-increment: item;
}
</style>
