'use strict';

module.exports = function() {

  var env = process.env.NODE_ENV || 'development';
  var appConstants = applicationConfig();

  var obj = {
    database: {
      host: dbConstants[env]['host'],
      port: dbConstants[env]['port'],
      database: dbConstants[env]['database'],
      user: dbConstants[env]['user'],
      password: dbConstants[env]['password']
    }
  };

  if (!obj.database['host']) {
    throw new Error('Missing constant database.host - check your environment variables')
  }
  else if (!obj.database['port']) {
    throw new Error('Missing constant database.port - check your environment variables')
  }
  else if (!obj.database['database']) {
    throw new Error('Missing constant database.database - check your environment variables')
  }
  else if (!obj.database['user']) {
    throw new Error('Missing constant database.user - check your environment variables')
  }
  else if (!obj.database['password']) {
    throw new Error('Missing constant database.password - check your environment variables')
  }

  return obj;

  function databaseConfig() {
    return {
      production: {
        host: process.env.DB_PRD_HOST,
        port: process.env.DB_PRD_PORT,
        database: process.env.DB_PRD_DATABASE,
        user: process.env.DB_PRD_USER,
        password: process.env.DB_PRD_PASSWORD
      },
      development: {
        host: process.env.DB_DEV_HOST,
        port: process.env.DB_DEV_PORT,
        database: process.env.DB_DEV_DATABASE,
        user: process.env.DB_DEV_USER,
        password: process.env.DB_DEV_PASSWORD
      }
    };
  }
}();
