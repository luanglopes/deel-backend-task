const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, Op } = require('./model')
const { getProfile } = require('./middleware/getProfile')

const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const { profile } = req
    const { id } = req.params
    
    const contract = await Contract.findOne({
        where: {
            id,
            [Op.or]: [
                { ClientId: profile.id },
                { ContractorId: profile.id }
            ]
        }
    })

    if(!contract) {
        return res.status(404).end()
    }
    
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const { profile } = req

    const contracts = await Contract.findAll({ 
        where: {
            status: {
                [Op.not]: 'terminated'
            },
            [Op.or]: [
                { ClientId: profile.id },
                { ContractorId: profile.id }
            ]
        }
    })

    res.json(contracts)
})

module.exports = app;
