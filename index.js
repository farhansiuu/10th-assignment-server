const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const serviceAccount = require("./ServicsKey.json");
const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_PET}:${process.env.DB_PASS}@cluster0.up1dmjq.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async(req,res,next)=>{
  const authorization = req.headers.authorization
  

  if(!authorization){
       return res.status(401).send({
          message: "unauthorize access"
        })
      }

      const token = authorization.split(' ')[1]

     try {
     await admin.auth().verifyIdToken(token)
     console.log(token)
       next()
  }
   catch(error){
    res.status(401).send({
      message: 'unauthorize access.'
    })
  }

}

async function run() {
  try {
   
    await client.connect();

    const db = client.db('pet_care')
    const petsCollection = db.collection('listing')
    const orderCollection = db.collection('myOrder')

    app.get('/listing',async(req,res)=>{
        const result = await petsCollection.find().toArray()
        res.send(result)
    })

    app.get('/recent-listing',async(req,res)=>{
      const result = await petsCollection.find().sort({date: 'desc'}).limit(6).toArray()
      res.send(result)
    })

    app.get('/order',verifyToken,async(req,res)=>{
      const email = req.query.email
      const result = await orderCollection.find({ordered_by:email}).toArray()
      res.send(result)
    })

    app.get('/list-details/:id',verifyToken, async(req,res)=>{
      const id = req.params.id
      const objectId = {_id: new ObjectId(id)}
      const query = {_id: (id)}
      const result = await petsCollection.findOne(query,objectId)
      res.send(result)
    })

    app.post('/listing',async(req,res)=>{
      const data = req.body
      const result = await petsCollection.insertOne(data)
      res.send(result)
    })

    app.post('/myOrder',async(req,res)=>{
      const data = req.body 
      const result = await orderCollection.insertOne(data)
      res.send(result)
    })

    app.delete('/order',async(req,res)=>{
      const {id} = req.body
      const result = await orderCollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)
    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
