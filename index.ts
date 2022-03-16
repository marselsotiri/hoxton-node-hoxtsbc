import { PrismaClient } from "@prisma/client"
import cors from "cors"
import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())


const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

app.post('/signup', async (req, res) => {
    const { email, fullName, password } = req.body

    try {
        const hashedPassword = bcrypt.hashSync(password, 10)

        const user = await prisma.user.create({
            data: {
                email: email, fullName: fullName, password: hashedPassword, amountInAccount: Math.floor(Math.random() * 100),
                transactions: {
                    create: {
                        amount: 1000,
                        currency: '$',
                        isPositive: false,
                        receiverOrSender: 'receiver',
                        completedAt: '04/14/2019'
                    }
                }
            }
        })
        //@ts-ignore
        const token = jwt.sign({ id: user.id }, process.env.MY_SECRET)
        res.send({ user, token: token })
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: error.message })
    }

})


app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findUnique({ where: { email: email }, include: { transactions: true } })
        //@ts-ignore
        const passwordMatch = bcrypt.compareSync(password, user.password)
        if (user && passwordMatch) {
            //@ts-ignore
            const token = jwt.sign({ id: user.id }, process.env.MY_SECRET)
            res.send({ user, token: token })
        }
        else {
            throw Error('Something went wrong!')
        }
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: 'User or password invalid' })
    }

})


app.get('/banking-info', async (req, res) => {
    const token = req.headers.authorization
    try {
        //@ts-ignore
        const decodedData = jwt.verify(token, process.env.MY_SECRET)
        //@ts-ignore
        const user = await prisma.user.findUnique({ where: { id: decodedData.id }, include: { transactions: true } })
        res.send(user)
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: 'User or password invalid' })
    }
})





app.listen(4000, () => {
    console.log('Server running: http://localhost:4000')
})