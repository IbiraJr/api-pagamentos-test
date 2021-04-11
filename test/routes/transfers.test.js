const request = require('supertest');
const app = require('../../src/app');
const MAIN_ROUTE = '/v1/transfers';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwIiwibmFtZSI6IlVzZXIgICMxIiwibWFpbCI6InVzZXIxQG1haWwuY29tIiwicGFzc3dvcmQiOiIkMmEkMTAkVDdELnowdkxaUlhZMWtEOEZBVUlaZVNZZ0E4T0V6Zi5IVGwuUTVaV2pybzB4M0pDT2tjbEMifQ.qY9TWoabfNFYqL_QYx9T3kINNyMhSH67mnvoKs7JHk4';


beforeAll( async ()=>{
    // await app.db.migrate.rollback();
    // await app.db.migrate.latest();
    await app.db.seed.run();
});

test('Deve listar apenas transferências do usuário', ()=>{
    return request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) =>{
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].description).toBe('Transfer #1');

    });
});

test('Deve inserir uma transferência com sucesso', ()=>{
    return request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date()})
    .then( async (res) =>{
        expect(res.status).toBe(201);
        expect(res.body.description).toBe('Regular Transfer');

        const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
        expect(transactions).toHaveLength(2);
        expect(transactions[0].description).toBe('Transfer to acc #10001');
        expect(transactions[1].description).toBe('Transfer from acc #10000');
        expect(transactions[0].ammount).toBe('-100.00');
        expect(transactions[1].ammount).toBe('100.00');
        expect(transactions[0].acc_id).toBe(10000);
        expect(transactions[1].acc_id).toBe(10001);
         
    });
});

describe('Ao salvar uma transfêrencia válida', () =>{
    let transferId;
    let income;
    let outcome;

    test('Deve retornar status 201 e os dados da transfêrencia', ()=>{
        return request(app).post(MAIN_ROUTE)
        .set('authorization', `bearer ${TOKEN}`)
        .send({description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date()})
        .then( async (res) =>{
            expect(res.status).toBe(201);
            expect(res.body.description).toBe('Regular Transfer');
            transferId = res.body.id;
        });    
    });

    test('As transações equivalentes devem ter sido geradas',async () =>{
        const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
        expect(transactions).toHaveLength(2);
        [outcome, income] = transactions;
    });

    test('A transação de saída deve ser negativa', ()=>{
        expect(outcome.description).toBe('Transfer to acc #10001');
        expect(outcome.ammount).toBe('-100.00');
        expect(outcome.acc_id).toBe(10000);
        expect(outcome.type).toBe('O');
    });
    
    test('A transação de entrada deve ser positiva', ()=>{
        expect(income.description).toBe('Transfer from acc #10000');
        expect(income.ammount).toBe('100.00');
        expect(income.acc_id).toBe(10001);
        expect(income.type).toBe('I');
    });

    test('Ambas devem estar com o status de realizada', () =>{
        expect(income.status).toBe(true);
        expect(outcome.status).toBe(true);
    });
});

describe('Ao tentar salvar uma transferência inválida', ()=>{
    const validTransfer = {description: 'Regular Transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date()};

    const template = (newTransfer, erroMessage) => {
        return request(app).post(MAIN_ROUTE)
        .set('authorization', `bearer ${TOKEN}`)
        .send({...validTransfer, ...newTransfer})
        .then( (res) =>{
            expect(res.status).toBe(400);
            expect(res.body.error).toBe(erroMessage);

        });  
    };

    test('Não deve inserir sem descricao', () => template({description: null}, 'Não pode inserir sem descricão'));    
    test('Não deve inserir sem valor', () => template({ammount: null}, 'Não pode inserir sem valor'));
    test('Não deve inserir sem data', () =>template({date: null}, 'Não pode inserir sem data'));
    test('Não deve inserir sem conta de origem', () =>template({acc_ori_id: null}, 'Não pode inserir sem conta de origem'));
    test('Não deve inserir sem conta de destino', () =>template({acc_dest_id: null}, 'Não pode inserir sem conta de destino'));

    test('Não deve inserir se as contas de origem e destino forem as mesmas ', () =>template({acc_dest_id: 10000}, 'Não é possível transferir para a mesma conta'));
    test('Não deve inserir se as contas pertecerem a outro usuário ', () =>template({acc_ori_id: 10002}, 'Conta #10002 não pertence ao usuário'));
});

test('Deve retornar uma transferência por id', () =>{
    return request(app).get(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) =>{
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Transfer #1');

    });
});

describe('Ao alterar uma transfêrencia válida', () =>{
    let transferId;
    let income;
    let outcome;

    test('Deve retornar status 200 e os dados da transfêrencia', ()=>{
        return request(app).put(`${MAIN_ROUTE}/10000`)
        .set('authorization', `bearer ${TOKEN}`)
        .send({description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 500, date: new Date()})
        .then( async (res) =>{
            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Transfer Updated');
            expect(res.body.ammount).toBe('500.00');
            transferId = res.body.id;
        });    
    });

    test('As transações equivalentes devem ter sido geradas',async () =>{
        const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
        expect(transactions).toHaveLength(2);
        [outcome, income] = transactions;
    });

    test('A transação de saída deve ser negativa', ()=>{
        expect(outcome.description).toBe('Transfer to acc #10001');
        expect(outcome.ammount).toBe('-500.00');
        expect(outcome.acc_id).toBe(10000);
        expect(outcome.type).toBe('O');
    });
    
    test('A transação de entrada deve ser positiva', ()=>{
        expect(income.description).toBe('Transfer from acc #10000');
        expect(income.ammount).toBe('500.00');
        expect(income.acc_id).toBe(10001);
        expect(income.type).toBe('I');
    });

    test('Ambas devem referenciar a transferência que as originou', () =>{
        expect(income.transfer_id).toBe(transferId);
        expect(outcome.transfer_id).toBe(transferId);
    });
});

describe('Ao tentar alterar uma transferência inválida', ()=>{
    const validTransfer = {description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date()};

    const template = (newTransfer, erroMessage) => {
        return request(app).put(`${MAIN_ROUTE}/10000`)
        .set('authorization', `bearer ${TOKEN}`)
        .send({...validTransfer, ...newTransfer})
        .then( (res) =>{
            expect(res.status).toBe(400);
            expect(res.body.error).toBe(erroMessage);

        });  
    };

    test('Não deve inserir sem descricao', () => template({description: null}, 'Não pode inserir sem descricão'));    
    test('Não deve inserir sem valor', () => template({ammount: null}, 'Não pode inserir sem valor'));
    test('Não deve inserir sem data', () =>template({date: null}, 'Não pode inserir sem data'));
    test('Não deve inserir sem conta de origem', () =>template({acc_ori_id: null}, 'Não pode inserir sem conta de origem'));
    test('Não deve inserir sem conta de destino', () =>template({acc_dest_id: null}, 'Não pode inserir sem conta de destino'));

    test('Não deve inserir se as contas de origem e destino forem as mesmas ', () =>template({acc_dest_id: 10000}, 'Não é possível transferir para a mesma conta'));
    test('Não deve inserir se as contas pertecerem a outro usuário ', () =>template({acc_ori_id: 10002}, 'Conta #10002 não pertence ao usuário'));
});

describe('Ao remover transferência', () =>{

    test('Deve retornar o status 204', () =>{
        return request(app).delete(`${MAIN_ROUTE}/10000`)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) => {
            expect(res.status).toBe(204);

        });
    });

    test('O registro deve ser removido do banco', () =>{
        return app.db('transfers').where({id: 10000})
        .then((result) =>{
            expect(result).toHaveLength(0);
        });
    });

    test('As transacoes associadas devem ter sido removidas', () =>{
        return app.db('transactions').where({transfer_id: 10000})
        .then((result) =>{
            expect(result).toHaveLength(0);
        });
    });
});

test('Não deve retornar transferência de outro usuário', () =>{
    return request(app).get(`${MAIN_ROUTE}/10001`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) =>{
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Este recurso não pertence ao usuário');

    });
});

