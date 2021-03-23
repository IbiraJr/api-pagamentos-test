const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

let user;
let user2;
let acc;
let acc2;
const MAIN_ROUTE = '/v1/transactions';
beforeAll(async() =>{
    await app.db('transactions').del();
    await app.db('accounts').del();
    await app.db('users').del();
    const users = await app.db('users').insert([
        {name: 'User #1', mail: 'user@mail.com', password: '$2a$10$T7D.z0vLZRXY1kD8FAUIZeSYgA8OEzf.HTl.Q5ZWjro0x3JCOkclC'},
        {name: 'User #2', mail: 'user2@mail.com', password: '$2a$10$T7D.z0vLZRXY1kD8FAUIZeSYgA8OEzf.HTl.Q5ZWjro0x3JCOkclC'},
    ], '*');
    [user, user2] = users;
    delete user.password;
    user.token = jwt.encode(user, 'segredo');
    const accs = await app.db('accounts').insert([
        {name: 'Acc #1', user_id: user.id},
        {name: 'Acc #2', user_id: user2.id}
    ], '*');
    [acc, acc2] = accs;
});

test('Deve listar apenas as transações do usuário ', () =>{
    return app.db('transactions').insert([
        { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: acc.id},
        { description: 'T2', date: new Date(), ammount: 300, type: 'I', acc_id: acc2.id},
    ]).then(() => request(app).get(MAIN_ROUTE)
     .set('authorization', `bearer ${user.token}`))
    .then((res) =>{
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].description).toBe('T1');
    });
});

test('Deve inserir uma transação com sucesso', () =>{
    return request(app).post(MAIN_ROUTE)
        .set('authorization', `bearer ${user.token}`)
        .send({description: 'New T', date: new Date(), ammount: 300, type: 'I', acc_id: acc.id})
        .then((res) =>{
         expect(res.status).toBe(201);
          expect(res.body.acc_id).toBe(acc.id);
    });
});

test('Deve retornar uma transação por id', () =>{
    return app.db('transactions').insert(
         { description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: acc.id},
         ['id']
         ).then(trans => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
             .set('authorization', `bearer ${user.token}`)
             .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body.id).toBe(trans[0].id);
                expect(res.body.description).toBe('T ID');
         }));
});
