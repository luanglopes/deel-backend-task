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

module.exports = jobsRouter
