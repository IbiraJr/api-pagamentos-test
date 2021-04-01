const express = require('express');

const RecursoIndevidoError = require('../erros/RecursoIndevidoError');
module.exports = (app) =>{
    const router = express.Router();

    router.param('id', (req, res, next)=>{
        app.services.account.find({id: req.params.id})
        .then((acc)=>{
            if(acc.user_id !== req.user.id) throw new RecursoIndevidoError();
            else next();
        }).catch(erro => next(erro));
    });

    router.post('/',(req, res, next) =>{
        app.services.account.save({...req.body, user_id: req.user.id})
        .then((result) =>{
            return res.status(201).json(result[0]);
        }).catch(erro => next(erro));
    });

    router.get('/' ,(req, res, next)=>{
        app.services.account.findAll(req.user.id )
        .then(result => res.status(200).json(result))
        .catch(erro => next(erro));
    });

    router.get('/:id',(req, res, next) =>{
        app.services.account.find({ id: req.params.id})
        .then((result) => res.status(200).json(result))
        .catch(erro => next(erro));
    });

    router.put('/:id',(req, res, next) =>{
        app.services.account.update(req.params.id, req.body)
        .then(result => res.status(200).json(result[0]))
        .catch(erro => next(erro));;
    });

    router.delete('/:id',(req, res, next) =>{
        app.services.account.remove(req.params.id)
        .then(() => res.status(204).send())
        .catch(erro => next(erro));
    });
    return router;
};