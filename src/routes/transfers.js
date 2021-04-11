const express = require('express');
const RecursoIndevidoError = require('../erros/RecursoIndevidoError');

module.exports = (app) =>{
    const router = express.Router();

    router.param('id', (req, res, next)=>{
        app.services.transfer.findOne({ id: req.params.id })
        .then((result) =>{
            if(result.user_id != req.user.id) throw new RecursoIndevidoError();
            next();
        }).catch((erro) => next(erro));
    });

    const validate = (req, res , next) =>{
        app.services.transfer.validate({...req.body, user_id: req.user.id})
        .then(() => next())
        .catch((erro) => next(erro));
    };

    router.get('/', (req,res, next) =>{
        app.services.transfer.find({ user_id: req.user.id })
        .then(result => res.status(200).json(result))
        .catch(erro => next(erro));
    });

    router.get('/:id', (req,res, next) =>{
        app.services.transfer.findOne({ id: req.params.id })
        .then(result => res.status(200).json(result))
        .catch(erro => next(erro));
    });

    router.post('/', validate, (req, res, next) =>{
        const transfer = { ...req.body, user_id: req.user.id};

        app.services.transfer.save(transfer)
        .then(result => res.status(201).json(result[0]))
        .catch(erro => next(erro));
    });

    router.put('/:id', validate, (req, res, next) =>{
        app.services.transfer.update(req.params.id, {...req.body, user_id: req.user.id})
        .then(result => res.status(200).json(result[0]))
        .catch(erro => next(erro));
    });

    router.delete('/:id', (req, res, next) =>{
        app.services.transfer.remove(req.params.id)
        .then(() => res.status(204).send())
        .catch(erro => next(erro));
    });

    return router;
} 