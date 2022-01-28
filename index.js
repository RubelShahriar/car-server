const express = require('express')
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId;
const app = express()
require('dotenv').config()
const cors = require('cors')
const fileUpload = require('express-fileupload')

//request port
const port = process.env.PORT || 4000

//middleware
app.use(cors())
app.use(express.json())
app.use(fileUpload())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qudl0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

async function run(){
    try{
        await client.connect()
        console.log('connected database')
        const database = client.db('carShop')
        const productCollection = database.collection('products')
        const orderCollection = database.collection('orders')
        const usersCollection = database.collection('users')
        const reviewCollection = database.collection('reviews')

        //post a product
        app.post('/products', async(req, res) => {
            const displayName = req.body.displayName
            const email = req.body.email
            const productName = req.body.productName
            const place = req.body.place
            const originalPrice = req.body.originalPrice
            const discountPrice = req.body.discountPrice
            const versionYear = req.body.versionYear
            const description = req.body.description
            const pic = req.files.image
            const picData = pic.data
            const encodedPic = picData.toString('base64')
            const imageBuffer = Buffer.from(encodedPic, 'base64')
            const product = {
                displayName,
                email,
                image: imageBuffer,
                productName,
                place,
                originalPrice,
                discountPrice,
                versionYear,
                description
            }
            const result = await productCollection.insertOne(product)
            res.json(result)
        })
        
        //GET API
        app.get('/products', async(req, res) =>{
            const cursor = productCollection.find({})
            const product = await cursor.toArray()
            res.send(product);
        })

        //post a order
        app.post('/orders', async(req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.json(result)
        })

        //post a review
        app.post('/reviews', async(req, res) => {
            const review = req.body
            const result = await reviewCollection.insertOne(review)
            res.json(result)
        })

        //GET reviews
        app.get('/reviews', async(req, res) =>{
            const cursor = reviewCollection.find({})
            const package = await cursor.toArray()
            res.send(package);
        })

        //get products based on user eamil
        app.get('/orders', async(req, res) => {
            if(req.query.email){
                const email = req.query.email
                const query = {email: email}
                const cursor = orderCollection.find(query)
                const result = await cursor.toArray()
                res.json(result)
            }
            else if(!req.query.email){
                const cursor = orderCollection.find({})
                const result = await cursor.toArray()
                res.json(result)
            }
        })

        //get a specific product
        app.get('/products/:id',async(req, res) =>{
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await productCollection.findOne(query)
            res.send(result)
        })

        //delete a product
        app.delete('/orders/:id', async(req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(query)
            res.json(result)
        })

        //get users
        app.post('/users', async(req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.json(result)
        })

        //upsert a user
        app.put('/users', async(req, res) => {
            const user = req.body
            const filter = {email: user.email}
            const options = { upsert: true }
            const updateDoc = {$set: user}
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        app.put('/users/admin', async(req, res) => {
            const user = req.body
            const filter = {email: user.email}
            const updateDoc = {$set: {role: 'admin'}}
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result)
        })

        app.get('/users/:email', async(req, res) => {
            const email = req.params.email
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            let isAdmin = false
            if(user?.role === 'admin'){
                isAdmin = true
            }
            res.json({admin: isAdmin})
        })

    }
    finally{
        // await client.close()
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Your Server is Running...')
})
app.get('/check-server', (req, res) => {
  res.send('car-app Server is Running...')
})

app.listen(port, () => {
  console.log(`car-server ${port}`)
})