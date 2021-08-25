# Database Design


The database is inside IdealOS is a simple object database. There are a list of objects. You can get them
directly by id, or query them based on properties of the objects. By convention all objects have 
a type and a category.

* data is stored on disk in json files
* at launch the json files are loaded into memory
* if a json file is modified on disk it will be reloaded automatically
* each category has a shadow file that is persisted to disk but not in source control
* when an app modifies the database, the changes are stored in the correct shadow file by category
* on relaunch, the original files are loaded into memory and then the shadow files are loaded on top
* modifying the json file on disk when there are also changes in the shadow file will wipe out the changes in the shadow file.

# open questions

* do we care about reloading when json changes? maybe just static base and then the overlay.
* if you want to reset, just nuke the overlays.

DB api:

* // listen for changes to a particular category
* // listen for changes to everything
* // start db: async
* // init db from on disk json and shadow files (shadow files are hidden from git)
* // client can listen for changes
* //client can add object, persist to shadow files
* client can delete object, persist record of deletion to shadow files
* //client can modify object, persist record of change to shadow files
* when client dies, listener must be cleaned up
  * autonomous process to always clean up listeners every 10 sec?
* // client can query for objects based on query object
* // find object by id
* // modify single property in db
* respond to general metrics request
  * print total object count
  * print total listener count
  * print total db size in in-memory bytes
  * print total db size in on disk bytes
  * print list of files used for db (static and shadow)
* // shutdown db: async
  * // kills any listeners
  * // persists and flushes everything to disk before quitting 
