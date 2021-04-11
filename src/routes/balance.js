const express = require('express');

module.exports = (app) =>{
    const router = express.Router();

    router.get('/', (req, res, next) =>{
         app.services.balance.getSaldo(req.user.id)
         .then(result => res.status(200).json(result))
         .catch(erro => next(erro));
         
    });
    
    return router;
};