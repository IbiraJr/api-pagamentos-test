const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');
const MAIN_ROUTE = '/v1/transactions';

let user;
let user2;
let acc;
let acc2;
beforeAll(async() =>{
    await app.db('transactions').del();
    await app.db('transfers').del();
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
           expect(res.body.ammount).toBe('300.00');
    });
});

test('Transações de entrada devem ser positivas', () =>{
    return request(app).post(MAIN_ROUTE)
        .set('authorization', `bearer ${user.token}`)
        .send({description: 'New T', date: new Date(), ammount: -300, type: 'I', acc_id: acc.id})
        .then((res) =>{
         expect(res.status).toBe(201);
          expect(res.body.acc_id).toBe(acc.id);
           expect(res.body.ammount).toBe('300.00');
    });
});

test('Transações de saida devem ser negativas', () =>{
    return request(app).post(MAIN_ROUTE)
        .set('authorization', `bearer ${user.token}`)
        .send({description: 'New T', date: new Date(), ammount: 300, type: 'O', acc_id: acc.id})
        .then((res) =>{
         expect(res.status).toBe(201);
          expect(res.body.acc_id).toBe(acc.id);
           expect(res.body.ammount).toBe('-300.00');
    });
});

describe('Ao inserir uma transação inválida', ()=>{
    // const validTransiction = {description: 'New T', date: new Date(), ammount: 300, type: 'I', acc_id: acc.id};
    let validTransaction;

    beforeAll(()=>{
        validTransaction = {description: 'New T', date: new Date(), ammount: 300, type: 'I', acc_id: acc.id};
    });
    const testTemplate =  (newTransaction, erroMessage) => {
        return request(app).post(MAIN_ROUTE)
            .set('authorization', `bearer ${user.token}`)
            .send({...validTransaction, ...newTransaction})
            .then((res) =>{
            expect(res.status).toBe(400); 
            expect(res.body.error).toBe(erroMessage);
        });
    };
    test('Não deve inserir sem descrição ', () => testTemplate({description: null}, 'Descrição é um atributo obrigatorio'));
    test('Não deve inserir sem valor ', () => testTemplate({ammount: null}, 'Valor é um atributo obrigatorio'));
    test('Não deve inserir sem data ', () => testTemplate({date: null}, 'Data é um atributo obrigatorio'));
    test('Não deve inserir sem conta ', () => testTemplate({acc_id: null}, 'Conta é um atributo obrigatorio'));
    test('Não deve inserir sem tipo ', () => testTemplate({type: null}, 'Tipo é um atributo obrigatorio'));
    test('Não deve inserir com tipo invalido ', () => testTemplate({type: 'A'}, 'Tipo inválido'));
});

test('Deve retornar uma transação por id', () => {
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

test('Deve alterar uma transação', () => {
    return app.db('transactions').insert(
        { description: 'T to update', date: new Date(), ammount: 100, type: 'I', acc_id: acc.id},
        ['id']
        ).then(trans => request(app).put(`${MAIN_ROUTE}/${trans[0].id}`)
            .set('authorization', `bearer ${user.token}`)
            .send({description: 'T updated'})
            .then((res) =>{
                 expect(res.status).toBe(200);
                  expect(res.body.description).toBe('T updated');
            }));   
});

test('Deve remover uma transação', () => {
    return app.db('transactions').insert(
        { description: 'T to delete', date: new Date(), ammount: 100, type: 'I', acc_id: acc.id},
        ['id']
        ).then(trans => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
            .set('authorization', `bearer ${user.token}`)
            .then((res) =>{
                 expect(res.status).toBe(204);
            }));   
});

test('Não deve remover uma transação de outro usuario', () => {
    return app.db('transactions').insert(
        { description: 'T to delete', date: new Date(), ammount: 100, type: 'I', acc_id: acc2.id},
        ['id']
        ).then(trans => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
            .set('authorization', `bearer ${user.token}`)
            .then((res) =>{
                 expect(res.status).toBe(403);
                  expect(res.body.error).toBe('Este recurso não pertence ao usuário');
            }));   
});

test('Não deve remover conta com transação', () => {
    return app.db('transactions').insert(
        { description: 'To delete', date: new Date(), ammount: 100, type: 'I', acc_id: acc.id},
        ['id']
        ).then(() => request(app).delete(`/v1/accounts/${acc.id}`)
            .set('authorization', `bearer ${user.token}`)
            .then((res) =>{
                 expect(res.status).toBe(400);
                
                  expect(res.body.error).toBe('Essa conta possui transações associadas');
            }));   
});