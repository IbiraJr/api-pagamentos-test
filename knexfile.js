module.exports = {
    test: {
        client: 'pg',
        connection:{
            host: 'localhost',
            user: 'postgres',
            password: '123456789',
            database: 'api_pagamentos',
        },
        migrations: {
            directory: 'src/migrations',
        },
        seeds: {
            directory: 'src/seeds',
        },
    },
};