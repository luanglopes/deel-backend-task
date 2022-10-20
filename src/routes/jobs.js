const { Router } = require("express");

const { getProfile } = require("../middleware/getProfile");

const jobsRouter = Router()

jobsRouter.get('/unpaid', getProfile, async (req, res) => {
    const { Job } = req.app.get('models')
    const sequelize = req.app.get('sequelize')
    const { profile } = req

    const jobs = await sequelize.query(
        'SELECT * FROM Jobs j JOIN Contracts c ON c.id = j.ContractId WHERE c.status = :status AND (c.ClientId = :profileId OR c.ContractorId = :profileId) AND (j.paid = :paid OR j.paid IS NULL)',
        {
            replacements: {
                status: 'in_progress',
                profileId: profile.id,
                paid: false
            },
            model: Job,
            mapTopModel: true
        })

    res.json(jobs)
})

jobsRouter.post('/:id/pay', async (req, res) => {
    const { Job, Contract, Profile } = req.app.get('models')
    const sequelize = req.app.get('sequelize')

    const { id } = req.params

    const t = await sequelize.transaction()

    try {
        const job = await Job.findOne({
            where: { id },
            include: {
                model: Contract,
                include: [
                    {
                        model: Profile,
                        as: 'Client'
                    }, {
                        model: Profile,
                        as: 'Contractor'
                    }
                ]
            },
            transaction: t
        })
        
        if (!job) {
            await t.rollback()
            return res.status(404).end()
        }

        const { price, Contract: contract } = job
        const { Client: client, Contractor: contractor } = contract

        if (price > client.balance) {
            await t.rollback()
            return res.status(400).json({ message: 'Insufficient funds' })
        }

        const newClientBalance = client.balance - price
        const newContractorBalance = contractor.balance + price

        await Promise.all([
            Profile.update({ balance: newClientBalance }, { where: { id: client.id }, transaction: t }),
            Profile.update({ balance: newContractorBalance }, { where: { id: contractor.id }, transaction: t }),
            Job.update({ paid: true, paymentDate: new Date() },{ where: { id: job.id }, transaction: t })
        ])

        await t.commit()
        
        res.sendStatus(204)
    } catch (error) {
        console.log(error)
        await t.rollback()

        res.status(500).end()
    }
})

module.exports = jobsRouter
