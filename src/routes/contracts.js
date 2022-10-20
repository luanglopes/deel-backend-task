const { Router } = require("express");

const { getProfile } = require('../middleware/getProfile')
const { Op } = require("../model");

const contractsRouter = Router()

contractsRouter.get('/:id', getProfile, async (req, res) => {
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

contractsRouter.get('/', getProfile, async (req, res) => {
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

module.exports = contractsRouter
