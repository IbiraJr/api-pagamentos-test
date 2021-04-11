const request = require('supertest');
const app = require('../../src/app');
const moment = require('moment');
const MAIN_ROUTE = '/v1/balance';
const ROUTE_TRANSACTION = '/v1/transactions';
const ROUTE_TRANSFER = '/v1/transfers';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMTAwIiwibmFtZSI6IlVzZXIgICMzIiwibWFpbCI6InVzZXIzQG1haWwuY29tIiwicGFzc3dvcmQiOiIkMmEkMTAkVDdELnowdkxaUlhZMWtEOEZBVUlaZVNZZ0E4T0V6Zi5IVGwuUTVaV2pybzB4M0pDT2tjbEMifQ.fiPuiQurs8zB9JIif_AiebK5N2qQzvV_DyOJP2rscUI';
const TOKEN_GERAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMTAyIiwibmFtZSI6IlVzZXIgICM1IiwibWFpbCI6InVzZXI1QG1haWwuY29tIiwicGFzc3dvcmQiOiIkMmEkMTAkVDdELnowdkxaUlhZMWtEOEZBVUlaZVNZZ0E4T0V6Zi5IVGwuUTVaV2pybzB4M0pDT2tjbEMifQ.K3mx45jDzJZppYPXHFnj7Hy9IFcWoSEyvSkddnOKbgw';


beforeAll( async ()=>{
    // await app.db.migrate.rollback();
    // await app.db.migrate.latest();
    await app.db.seed.run();
});

describe('Ao calcular o saldo do usuario', () =>{
    test('Deve retornar apenas as contas com alguma transacao', ()=>{
        return request(app).get(MAIN_ROUTE)
        .set('authorization', `bearer ${TOKEN}`)
        .then((res) =>{
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(0);
        });
    });
    test('Deve adicionar valores de entrada', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: new Date(), ammount: 100.00, type: 'I', acc_id: 10100, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(1);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('100.00');
            });
        });
    });
    test('Deve subitrair as contas de saida', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: new Date(), ammount: 200.00, type: 'O', acc_id: 10100, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(1);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('-100.00');
            });
        });
    });
    test('Não deve considerar transacoes pendentes', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: new Date(), ammount: 200.00, type: 'O', acc_id: 10100, status: false})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(1);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('-100.00');
            });
        });
    });
    test('Não deve considerar saldo de contas distintas', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: new Date(), ammount: 50.00, type: 'I', acc_id: 10101, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('-100.00');
                expect(res.body[1].id).toBe(10101);
                expect(res.body[1].sum).toBe('50.00');
            });
        });
    });
    test('Não deve considerar contas de outro usuario', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: new Date(), ammount: 200.00, type: 'O', acc_id: 10102, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('-100.00');
                expect(res.body[1].id).toBe(10101);
                expect(res.body[1].sum).toBe('50.00');
            });
        });
    });
    test('Deve considerar transacoes passadas', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: moment().subtract({days: 5}), ammount: 250.00, type: 'I', acc_id: 10100, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('150.00');
                expect(res.body[1].id).toBe(10101);
                expect(res.body[1].sum).toBe('50.00');
            });
        });
    });
    test('Não deve considerar transacoes futuras', ()=>{
        return request(app).post(ROUTE_TRANSACTION)
        .send({description: '1', date: moment().add({days: 5}), ammoount: 250.00, type: 'I', acc_id: 10100, status: true})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('150.00');
                expect(res.body[1].id).toBe(10101);
                expect(res.body[1].sum).toBe('50.00');
            });
        });
    });
    test('Deve considerar transferencias', ()=>{
        return request(app).post(ROUTE_TRANSFER)
        .send({description: '1', date: new Date(), ammount: 250.00, acc_ori_id: 10100, acc_dest_id: 10101})
        .set('authorization', `bearer ${TOKEN}`)
        .then(() =>{
            return request(app).get(MAIN_ROUTE)
            .set('authorization', `bearer ${TOKEN}`)
            .then((res) =>{
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].id).toBe(10100);
                expect(res.body[0].sum).toBe('-100.00');
                expect(res.body[1].id).toBe(10101);
                expect(res.body[1].sum).toBe('300.00');
            });
        });
    });
});

test('Deve calcular saldo das contas do usuario', () =>{
    return request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN_GERAL}`)
    .then((res) =>{
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].id).toBe(10104);
        expect(res.body[0].sum).toBe('162.00');
        expect(res.body[1].id).toBe(10105);
        expect(res.body[1].sum).toBe('-248.00');
    });
});