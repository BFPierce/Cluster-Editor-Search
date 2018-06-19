## Cluster-Search-Editor

This is a sample application developed for a client, demonstrates a REST API written in PHP along with associated end points, security management, and a single page application written in AngularJS.

### Problem Statement

The client had a need to be able to manage a component of the curriculum (University Level) called a 'Cluster'. These components consist of groups of academic courses, the short version of what the client was looking to be able to do in order to manage these items was the following:

- Update information about a cluster, including groups and courses within those groups, allow for specifying the order of the displayed components.
- Review all updates to a cluster prior to publishing this information to students.
- Be able to search in the editor as well as being able to view the current cluster and a history of changes to a cluster.

### Data Model

This application's backend data model was written in MySQL and consists of 14 database tables, 9 of which store information about clusters in a one to many relationship across three different environments. 

[Cluster -> Group(s) -> Course(s)] is the relationship used, there are three environments in the editor:

- Publish is viewable to the public, this is where a final reviwed cluster lives until it is replaced.
- Stage is a 'working copy' of the cluster which is modified during editing. When editing an existing cluster a copy is shifted to this environment.
- Archive contains a copy of every cluster that was published. When a cluster is published from the stage, the current published version is archived, and the stage pushed to the publish environment.

The remaining 5 database tables are utility tables, such as a place to record query's made through the search panel for research, or the admin table containing who should be allowed to do what in the application.

### API Structure

This application uses a REST API which handles various GET, POST, DELETE, and PUT requests and handle the security surrounding these requests. This was written in PHP with no framework based on an open source Abstract class for the structure of the API. api/registrar_api.php shows the general structure of the end points available to this system.

### Application Structure

Each component here handles a specific part of the business process. 

- Main - primary dashboard for the application, allows for modal based data entry in order to kick off all other processes.
- Search - Handle data entry for the search query and store this result within the service responsible for interacting with the API.
- Results - Display the results of a stored query by executing it and appropriately formatting the results.
- Edit - Allow for editing an existing 'cluster', this is designed to be 'live on the database', so no saving is necessary. This app allows for creating cluster components, modifying fields, and reordering the components right in the editor. When a new cluster is created from the dashboard, this module is also used to edit that new cluster.
- Publish - Review and publish changes to a cluster, you can also edit a cluster directly from this page.
- History - Show a listing of all changes made historically to a cluster.

### Services

I used four angular services for this particular application.

- Authentication - Authenticates a user via the backend system, and stores the JWT (JSON Web Token) which contains it's own expiration date and information about the logged in user. This also attaches the token as a 'bearer token' to all future HTTP requests made to the API for validation on the backend.
- Cluster - This service handles all HTTP requests to the API regarding the cluster itself, each are returned as Javascript promises which are chained as necessary in the controller to handle most logic.
- Search - This services stores and query and executes that query, deferring to the caller for further display.
- StaticData - This services interacts with various endpoints for creating drop down lists and other static components, this component is reusable with other applications I've built using this displayed method.