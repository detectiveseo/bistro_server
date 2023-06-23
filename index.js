const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.darcm8e.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//jwt Token create
app.post('/jwt', async(req, res) => {
  const body = req.body;
  const token = jwt.sign(req.body, process.env.SICURE_TOKEN, {expiresIn: "1h"})
  res.send(token);
})


const verifyJwt = (req, res, next) => {
  const authorization =  req.headers.authorization;
  console.log(authorization)
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorization access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.SICURE_TOKEN, (err, decoded) => {
    if(err){
      return res.status(403).send({error: true, message: 'unauthorization access'})
    }
    req.decoded = decoded;
    next();
  })
};

async function run() {
  try {
    await client.connect();

    // database collections 
    const menuCollection = client.db("DB_BOSS").collection("menus");
    const add_to_cartCollection = client.db("DB_BOSS").collection("addToCart");
    const mangeUsers = client.db("DB_BOSS").collection("user_manage");


    app.get("/menus", async (req, res) => {
      const menus = await menuCollection.find().toArray();
      res.send(menus);
    })

    app.post("/add-to-cart", async (req, res) => {
      const body = req.body;
      const result = await add_to_cartCollection.insertOne(body)
      console.log(result)
      res.send(result)
    })

    app.get("/added-items/:email", async (req, res) => {
      const email = req.params.email;
      const limit = Math.round(req.query.limit) || 5;
      const page = Math.round(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const query = { email: email };
      const result = await add_to_cartCollection.find(query).limit(limit).skip(skip).toArray();
      res.send(result);
    })

    app.get("/total-added-food",  async (req, res) => {
      const email = req.query?.email;
      const result = await add_to_cartCollection.find({ email: email }).toArray();
      res.send(result);
    })

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await add_to_cartCollection.deleteOne({});
      res.send(result);
    })

    //mange users 
    app.post("/users", async(req, res) => {
      const result = await menuCollection.find().toArray();
      // const res = await mangeUsers.insertOne(req.body);
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`your port is runing on this ${port}`)
})

