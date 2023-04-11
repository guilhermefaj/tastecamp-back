import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

// Criação do App Servidor
const app = express()

// Configurações
app.use(cors()) // Acesar a API em um front-end
app.use(express.json()) // Os dados que trocaremos com o cliente estarão em formato json


// Conexão com o banco de dados
let db
const mongoClient = new MongoClient("mongodb://localhost:27017/tastecamp")
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


app.get("/receitas", (req, res) => {
    // const { ingrediente } = req.query

    // if (ingrediente) {
    //     const receitasFiltradas = receitas.filter(
    //         receita => receita.ingredientes.toLowerCase().includes(ingrediente.toLowerCase())
    //     )
    //     return res.send(receitasFiltradas)
    // }

    db.collection("receitas").find().toArray()
        .then(receitas => res.send(receitas))
        .catch(err => res.status(500).send(err.message))
})

app.get("/receitas/:id", (req, res) => {
    const { id } = req.params // const id = req.params.id
    const { auth } = req.headers

    // if (auth !== "Guiu") {
    //     return res.sendStatus(401)
    // }
    const receita = receitas.find((item) => item.id === Number(id))

    res.send(receita)
})

app.post("/receitas", (req, res) => {

    const { titulo, ingredientes, preparo } = req.body

    if (!titulo || !ingredientes || !preparo) {
        return res.status(422).send("Todos os campos são obrigatórios.")
    }

    const novaReceita = { titulo, ingredientes, preparo }

    db.collection("receitas").insertOne(novaReceita)
        .then(() => res.sendStatus(201))
        .catch(err => res.status(500).send(err.message))
})

const PORT = 4000 //Disponíveis: 3000 à 5999
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)) 