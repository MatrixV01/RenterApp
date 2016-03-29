module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      database: 'RNTR_dev'
    },
    seeds: {
      directory: './seeds'
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      database: 'RNTR_test'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL
  }
}
