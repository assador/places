# places

v5.6.12  
A Vue.js project  
“The Places” — yet another geo placemarks viewer and editor service  
Testing address: <http://places.assador.website>

The service allows to add and edit geo placemarks with names, descriptions, latitude / longitude values and photo albums; arrange that places and folders in the folder tree, sort places and their photo albums, export places libraries to files of various formats, import them from such files, search for places by name, and much more. The cartographic part uses Yandex.Maps and OSM, everything else is independent.

## Installation

1. Clone repository.
2. Inside cloned: npm install && npm run build
2. Configure the web server. Specify /dist as the root directory.
3. Create a database and import into it tables from the dump file /mezzanine/db_places.sql.
4. Edit /src/shared/constants.js and /backend/config.php files according to your preferencies.
5. In the same /backend/config.php specify the test account ID, if you need it.
6. Configure permissions of directories: /dist/uploads/images/big, /dist/uploads/images/big/orphaned, /dist/uploads/images/small, /dist/uploads/images/small/orphaned
7. Add a cron job that runs /backend/dist/cron.php, a script that deletes sometimes orphan images and waypoints.

If you suddenly have a foolish desire to donate, disinterestedly or selfishly, you can do it here: <https://www.paypal.me/niaouveas>. Self-interest, if any, can be expressed by writing a letter to [assador@gmail.com](mailto:assador@gmail.com).
