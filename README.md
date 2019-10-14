# places

v2.11.5  
A Vue.js project  
“The Places” — yet another geo placemarks viewer and editor service  
Testing address: http://places.scrofa-tridens.ru/

The service allows to add and edit geo placemarks with names, descriptions, latitude / longitude values and photo albums; arrange that places and folders in the folder tree, sort places and their photo albums, export places libraries to a JSON file, import them from a JSON file, search for places by name, and much more. The cartographic part uses the Yandex.Maps API, everything else is independent.

## Installation

1. Clone repository to working directory.
2. Configure the web server. Specify /dist as the root directory.
3. Create a database and import into it tables from the dump file /mezzanine/db_places.sql.
4. Edit /src/shared/constants/js (if you’re going to rebuild the project) and /dist/backend/config.php files according to your preferencies.
5. In the same /dist/backend/config.php specify the test account ID, if you need it.  
If you don’t, just leave it as is, or specify the empty string.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).
