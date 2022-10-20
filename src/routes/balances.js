const { Router } = require("express");

const { Op } = require('../model') 

const balancesRouter = Router()

balancesRouter.post('/deposit/:clientId', async (req, res) => {
    const { Job, Contract, Profile } = req.app.get('models')
    const sequelize = req.app.get('sequelize')
    const { clientId }  = req.params
    const { amount } = req.body

    const t = await sequelize.transaction()

    try {
        const totalJobsToPayPrice = await Job.sum('price', {
            where: {
                [Op.or]: [
                    { paid: false },
                    { paid: null }
                ],
                '$Contract.ClientId$': clientId,
            },
            include: Contract,
            transaction: t
        })
        
        const maximumDepositAmount = totalJobsToPayPrice * 0.25
        
        if (amount > maximumDepositAmount) {
            await t.rollback()
            return res.status(400).json({ message: 'Amount too high' })
        }
        
        await Profile.increment({ balance: amount }, { where: { id: clientId }, transaction: t })

        await t.commit()
        
        res.sendStatus(204)
    } catch (error) {
        await t.rollback()

        res.status(500).end()
    }
})

module.exports = balancesRouter
