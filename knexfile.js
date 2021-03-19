module.exports = {
    test: {
        client: 'pg',
        connection:{
            host: 'localhost',
            user: 'postgres',
            password: '123456789',
            database: 'api-pagamentos',
        },
        migrations: {
            directory: 'src/migrations',
        },
    },
};