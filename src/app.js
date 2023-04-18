import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import joi from "joi"

// Criação do App Servidor
const app = express()

// Configurações
app.use(cors())
app.use(express.json())
dotenv.config()

// Conexão com o banco de dados

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err.message)
}
const db = mongoClient.db()

// Schemas

const usuarioSchema = joi.object({
    nome: joi.string().required(),
    email: joi.string().email().required(),
    senha: joi.string().min(3).required()
})

// Endpoints
app.get("/receitas", async (req, res) => {
    try {
        const receitas = await db.collection("receitas").find().toArray()
        res.send(receitas)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/receitas/:id", async (req, res) => {
    const { id } = req.params

    try {
        const receita = await db.collection("receitas").findOne({ _id: new ObjectId(id) })
        if (!receita) return res.status(404).send("Receita não existe")
        res.send(receita)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/receitas", async (req, res) => {
    const { titulo, ingredientes, preparo } = req.body

    if (!titulo || !ingredientes || !preparo) {
        return res.status(422).send("Todos os campos são obrigatórios")
    }

    const novaReceita = { titulo, ingredientes, preparo }

    try {
        const recipe = await db.collection("receitas").findOne({ titulo: titulo })
        if (recipe) return res.status(409).send("Essa receita já existe!")

        await db.collection("receitas").insertOne(novaReceita)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete("/receitas/:id", async (req, res) => {
    const { id } = req.params

    try {
        const result = await db.collection("receitas").deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) return res.status(404).send("Esse item não existe!")
        res.send("Item deletado com sucesso!")

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete("/receitas/muitas/:filtroIngredientes", async (req, res) => {
    const { filtroIngredientes } = req.params

    try {
        const result = await db.collection("receitas").deleteMany({ ingredientes: filtroIngredientes })
        if (result.deletedCount === 0) return res.status(404).send("Não ha receitas com esse critério")
        res.send("Ites deletados com sucesso")
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.put("/receitas/:id", async (req, res) => {
    const { id } = req.params
    const { titulo, preparo, ingredientes } = req.body

    const receitaEditada = {}
    if (titulo) receitaEditada.titulo = titulo
    if (preparo) receitaEditada.preparo = preparo
    if (ingredientes) receitaEditada.ingredientes = ingredientes

    try {
        const result = await db.collection("receitas").updateOne(
            { _id: new ObjectId(id) },
            { $set: receitaEditada }
        )
        if (result.matchedCount === 0) return res.status(404).send("Esse item não existe!")
        res.send("Receita atualizada!")
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.put("/receitas/muitas/:filtroIngredientes", async (req, res) => {
    const { filtroIngredientes } = req.params
    const { titulo, preparo, ingredientes } = req.body

    const receitaEditada = {}
    if (titulo) receitaEditada.titulo = titulo
    if (preparo) receitaEditada.preparo = preparo
    if (ingredientes) receitaEditada.ingredientes = ingredientes

    try {
        const result = await db.collection("receitas").updateMany(
            { ingredientes: { $regex: filtroIngredientes, $options: "i" } },
            { $set: receitaEditada }
        )

        if (result.matchedCount === 0) return res.status(404).send("Não há nenhuma receita com esse filtro!")
        res.send("Receitas editadas!")

    } catch (err) {
        res.status(500).send(err.message)
    }
})


app.post("/sign-up", async (req, res) => {
    const { nome, email, senha } = req.body

    const validation = usuarioSchema.validate(req.body, { abortEarly: false })
    if (validation.error) {
        const errors = validation.error.datails.map(detail => detail.message)
        return res.status(422).send(errors)
    }

    try {
        const usuario = await db.collection("usuarios").findOne({ email })
        if (usuario) return res.status(409).send("E-mail já cadastrado")

        const hash = bcrypt.hashSync(senha, 10)

        await db.collection("usuarios").insertOne({ nome, email, senha: hash })
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/sign-in", async (req, res) => {
    const { email, senha } = req.body

    try {
        const usuario = await db.collection("usuarios").findOne({ email })
        if (!usuario) return res.status(401).send("E-mail não cadastrado.")

        const senhaEstaCorreta = bcrypt.compareSync(senha, usuario.senha)
        if (!senhaEstaCorreta) return res.status(401).send("A senha está incorreta!")

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

// Deixa o app escutando, à espera de requisições
const PORT = 4000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)) // 3000 e 5999