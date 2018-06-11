## Cluster-Search-Editor

This is a sample application developed for a client, demonstrates a REST API written in PHP along with associated end points, security management, and a single page application written in AngularJS.

### Problem Statement

The client had a need to be able to manage a component of the curriculum (Univeristy Level) called a 'Cluster'. These components consist of groups of academic courses, the short version of what the client was looking to be able to do in order to manage these items was the following.

- Update information about a cluster, including groups and courses within those groups.
- Be able to search in the editor as well as being able to view the current cluster and a history of changes to a cluster.

### Data Model

This applications backend data model was written in MySQL and consists of 14 database tables, 9 of which store information about a cluster in a one to many relationship across three different environments. [Cluster -> Groups -> Courses] is the relationship used, there are three environments in the editor, Publish is viewable to the public, Stage is a 'working copy' of the cluster, and Archive contains a copy of every cluster that was published. In this model when a cluster is published from the stage (and already exists) then a copy of the current published cluster is archived for research purposes. The remaining 5 database tables are utility tables, such as a place to record query's made through the search panel for research, or the admin table containing who should be allowed to do what in the application.