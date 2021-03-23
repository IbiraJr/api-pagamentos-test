const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const mail = `${Date.now()}@mail.com`;
let user; 

const MAIN_ROUTE = '/v1/users';

beforeAll(async() =>{
    const res = await app.services.user.save({name: 'User Account', mail: `${Date.now()}@mail.com`, password: 123456});
    user = { ...res[0] };
    user.token = jwt.encode(user, 'segredo');
});


test('Deve listar todos os usuarios', () =>{
    return request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });
});

test('Deve inserir usuario com sucesso', () =>{
    return request(app).post(MAIN_ROUTE)
    .send({name: 'Walter Mitty', mail, password: '123456'})
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Walter Mitty');
        expect(res.body).not.toHaveProperty('password');
    });
});

test('Deve armazenar senha criptografada',async () =>{
    const res = await request(app).post(MAIN_ROUTE)
    .send({name: 'Walter Mitty', mail: `${Date.now()}@mail.com`, password: '123456'})
    .set('authorization', `bearer ${user.token}`);
    expect(res.status).toBe(201);

    const {id} = res.body;
    const userDB = await app.services.user.findOne({id});
    expect(userDB.password).not.toBeUndefined();
    expect(userDB.password).not.toBe('123456');
});

test('Não deve inserir usuário sem nome', ()=>{
    return request(app).post(MAIN_ROUTE)
    .send({mail: 'walter@mail.com', password: '123456'})
    .set('authorization', `bearer ${user.token}`)
    .then((res) =>{
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Nome é um atributo obrigatório');
    });
});

test('Não deve inserir usuário sem email',async () =>{
    const result = await request(app).post(MAIN_ROUTE)
    .send({name: 'Walter Mitty', password: '123456'})
    .set('authorization', `bearer ${user.token}`);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Email é um atributo obrigatório');
});

test('Usuário sem senha ', (done) =>{
    request(app).post(MAIN_ROUTE)
    .send({name: 'Walter Mitty',mail: 'walter@mail.com'})
    .set('authorization', `bearer ${user.token}`)
    .then((res) =>{
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Senha é um atributo obrigatório');
        done();
    });
});

test('Não deve inserir usuário com email existente', ()=>{
    return request(app).post(MAIN_ROUTE)
    .send({name: 'Walter Mitty', mail, password: '123456'})
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Já existe um usuário com este email');
    });
});