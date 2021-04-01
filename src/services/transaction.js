const ValidationErro = require('../erros/ValidationError');

module.exports = (app) =>{
    const find = (userId, filter ={}) =>{
        return app.db('transactions')
        .join('accounts', 'accounts.id', 'acc_id')
        .where(filter)
        .andWhere('accounts.user_id', '=', userId)
        .select();
    };
    const findOne = (filter) =>{
        return app.db('transactions')
        .where(filter)
        .first();
    };
    const save = (transaction) =>{
        if(!transaction.description) throw new ValidationErro('Descrição é um atributo obrigatorio');
        if(!transaction.ammount) throw new ValidationErro('Valor é um atributo obrigatorio');
        if(!transaction.date) throw new ValidationErro('Data é um atributo obrigatorio');
        if(!transaction.acc_id) throw new ValidationErro('Conta é um atributo obrigatorio');
        if(!transaction.type) throw new ValidationErro('Tipo é um atributo obrigatorio');
        if(!(transaction.type === 'I' || transaction.type === 'O') ) throw new ValidationErro('Tipo inválido');
        const newTransaction = {...transaction};
        if((transaction.type === 'I' && transaction.ammount < 0)
         || (transaction.type === 'O' && transaction.ammount > 0)){
            newTransaction.ammount *= -1;
         }
        return app.db('transactions')
        .insert(newTransaction, '*');
    };

    const update = (transaction, id) =>{
        return app.db('transactions')
        .where({id})
        .update(transaction, '*')
    };

    const remove = (id) =>{
        return app.db('transactions')
        .where({id})
        .del();
    }
    return { find, save, findOne, update, remove };
};