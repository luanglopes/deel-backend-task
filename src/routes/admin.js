const { Router } = require("express");

const adminRouter = Router()

adminRouter.get('/best-profession', async (req, res) => {
    const { start, end } = req.query
    const sequelize = req.app.get('sequelize')

    const startDate = new Date(start)
    const endDate = new Date(end)

    const [result] = await sequelize.query('SELECT sum(j.price) AS total, p.profession FROM Profiles p JOIN Contracts c ON c.ContractorId = p.id JOIN Jobs j ON j.ContractId = c.id WHERE j.paid = :paid AND (j.createdAt BETWEEN :startDate AND :endDate) GROUP BY p.profession ORDER BY total DESC', {
        replacements: {
            paid: true,
            startDate,
            endDate
        }
    })

    const { profession } = result[0]

    res.json({ profession })
})

adminRouter.get('/best-clients', async (req, res) => {
    const { start, end, limit = 2 } = req.query
    const sequelize = req.app.get('sequelize')

    const startDate = new Date(start)
    const endDate = new Date(end)

    const [result] = await sequelize.query('SELECT p.id AS id, p.firstName || p.lastName AS fullName, sum(j.price) AS paid FROM Profiles p JOIN Contracts c ON c.ClientId = p.id JOIN Jobs j ON j.ContractId = c.id WHERE j.paid = :paid AND (j.createdAt BETWEEN :startDate AND :endDate) GROUP BY p.id ORDER BY paid DESC LIMIT :limit', {
        replacements: {
            paid: true,
            startDate,
            endDate,
            limit
        }
    })

    res.json(result)
})

module.exports = adminRouter
