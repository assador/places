# places

v3.0.0  
A Vue.js project  
“The Places” — yet another geo placemarks viewer and editor service  
Testing address: http://places.scrofa-tridens.ru/

The service allows to add and edit geo placemarks with names, descriptions, latitude / longitude values and photo albums; arrange that places and folders in the folder tree, sort places and their photo albums, export places libraries to files of various formats, import them from such files, search for places by name, and much more. The cartographic part uses the Yandex.Maps API, everything else is independent.

## Installation

1. Clone repository to working directory.
2. Configure the web server. Specify /dist as the root directory.
3. Create a database and import into it tables from the dump file /mezzanine/db_places.sql.
4. Edit /src/shared/constants.js (if you’re going to rebuild the project) and /public/backend/config.php files according to your preferencies.
5. In the same /public/backend/config.php specify the test account ID, if you need it.  
If you don’t, just leave it as is, or specify the empty string.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Run your end-to-end tests
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
