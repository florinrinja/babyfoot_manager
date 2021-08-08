# babyfoot_manager


#### Bootstrap the project
1. Clone the project
2. Run ``npm install`` in root directory

#### Database setup
3. Go to ``psql`` CLI and create ``babyfoot_manager`` database
  ```
  CREATE DATABASE babyfoot_manager;
  ```
4. Exit to shell CLI and type ``psql -U user_name babyfoot_manager < ~path_to/database.sql`` to create necessary tables (replace ``user_name`` with your own value)

#### nodeJS setup
5. Create ``.password.js`` file in root directory
6. Copy and paste the following into the file:
```
module.exports = {
    db_credentials: {
        user: 'DUMMY', // username
        password: 'DUMMY', // password
        host: 'DUMMY', // server address (default localhost)
        database: 'babyfoot_manager', // database name
        port: 5432 // default postgresql port number
    }
};
```
7. Replace the DUMMY values with your own corresponding values
8. Run ``node server.js`` in root directory

#### Front client
9. Go to ``http://localhost:4000/index.html`` to access the application
