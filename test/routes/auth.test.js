const request = require('supertest');
const app = require('../../src/app');


test('Deve criar usuário via signup', () =>{
    return request(app).post('/auth/signup')
    .send({ name: 'Walter', mail: `${Date.now()}@mail.com`, password: '123456'})
    .then((res) =>{
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Walter');
        expect(res.body).toHaveProperty('mail');
        expect(res.body).not.toHaveProperty('password');
    });
});

test('Deve receber token ao logar', () =>{
    const mail =  `${Date.now()}@mail.com`;
    return app.services.user.save(
        { name: 'Walter', mail, password: '123456' }
        )
    .then(() => request(app).post('/auth/signin')
    .send({mail, password: '123456'}))
    .then((res) =>{
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});

test('Não deve autenticar usuário com senha errada', () =>{
    const mail =  `${Date.now()}@mail.com`;
    return app.services.user.save(
        { name: 'Walter', mail, password: '123456' }
        )
    .then(() => request(app).post('/auth/signin')
    .send({mail, password: '654321'}))
    .then((res) =>{
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Usuário ou senha inválido');
    });
});

test('Não deve autenticar usuário com email inválido', () =>{
    return request(app).post('/auth/signin')
    .send({mail: 'naoExiste@mail.com', password: '654321'})
    .then((res) =>{
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Usuário ou senha inválido');
    });
});

test('Não deve acessar uma rota protegida sem token', () =>{
    return request(app).get('/v1/users')
    .then((res) =>{
        expect(res.status).toBe(401);
    });
});