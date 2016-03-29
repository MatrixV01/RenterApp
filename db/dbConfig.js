var config = require('../knexfile.js');
var env = process.env.NODE_ENV || 'development';
var knex = require('knex')(config[env]);

module.exports = knex;

knex.migrate.latest([config])
  .then(function(x) {
    // knex.seed.run()
    // .then(function(y){
    knex.destroy();
    // })

  })
  .catch(function(err) {
    console.error('migration error', err);
    knex.destroy();
  })
