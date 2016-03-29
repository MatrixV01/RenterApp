exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username').unique().notNullable();
      table.string('password').notNullable();
      table.string('email').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    }),

    knex.schema.createTable('items', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('address') //this can be null until post-MVP
      table.integer('zip').notNullable();
      table.string('category').notNullable();
      table.integer('price').notNullable();
      table.string('description').defaultTo('The item owner has not listed any details for this item.');
      table.string('photo').notNullable().defaultTo('http://www.ubeeco.com.au/products/g90eh7mvm.jpg')
      table.integer('item_owner').notNullable()
        .references('id')
        .inTable('users');
      table.dateTime('date_start').notNullable();
      table.dateTime('date_end').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    }),

    knex.schema.createTable('rentals', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable()
        .references('id')
        .inTable('users');
      table.integer('item_id').notNullable()
        .references('id')
        .inTable('items');
      table.dateTime('date_start').notNullable();
      table.dateTime('date_end').notNullable();
      table.string('is_confirmed').notNullable().defaultTo('false');
      table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    }),

    knex.schema.createTable('sessions', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable()
        .references('id')
        .inTable('users');
      table.string('session_id').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    })
  ])

};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema.dropTable('users'),
    knex.schema.dropTable('items'),
    knex.schema.dropTable('rentals'),
    knex.schema.dropTable('sessions')
  ])

};
