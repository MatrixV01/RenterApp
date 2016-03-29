exports.seed = function(knex, Promise) {
  return Promise.join(
    // Deletes ALL existing entries
    knex('rentals').del(),
    knex('items').del(),
    knex('users').del(),
    knex('sessions').del(),

    // Inserts seed entries
    knex('users').insert({
      username: 'Justin',
      password: 'RNTR',
      email: 'wayne.jch@gmail.com'
    }),
    knex('users').insert({
      username: 'Brad',
      password: 'RNTR',
      email: 'matrixv01@gmail.com'
    }),
    knex('users').insert({
      username: 'Tim',
      password: 'RNTR',
      email: 'tbooser@utexas.edu'
    })
  );
};
