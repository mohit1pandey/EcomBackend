const express = require('express');
const app = express();
//just require the config.
require('./db/config');
const User = require('./db/users') //inporeted the m
const Product = require('./db/product');
//cors
const cors = require('cors');

//jwt
const jwt = require('jsonwebtoken');
const jwtkey = 'ecom';
//this key should be secret


// now create a route for the registation
app.use(express.json());
app.use(cors());
//app.use used to access the json obj in side the app method
app.post('/register', async (req, res) => {
    // create a instacnce of the model which needs to be posted
    let newuser = new User(req.body);
    let result = await newuser.save();
    result = result.toObject();
    delete result.password;
    // now the result will be free of password

    jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (error, token) => {

        if (error) {
            res.send({ result: "something went wrong" })
        }
        res.send({ result, auth: token })

    })



})
// login route
app.post('/login', async (req, res) => {


    // to log in both are required 
    if (req.body.password && req.body.email) {
        //User is the instance of the collection and we substract the password filed from the out-put
        let user = await User.findOne(req.body).select("-password")
        if (user) {
            jwt.sign({ user }, jwtkey, { expiresIn: "2h" }, (error, token) => {

                if (error) {
                    res.send({ result: "something went wrong" })
                }
                res.send({ user, auth: token })

            })
        } else {
            res.send({ result: "No user Found" })
        }

    } else {
        res.send({ result: "No user Found" })
    }

})
// add product
app.post('/add-product',verifyToken, async (req, res) => {
    let product = new Product(req.body);

    let result = await product.save();
    res.send(result);
})

app.get('/products',verifyToken, async (req, res) => {
    const products = await Product.find();
    if (products.length > 0) {
        //products is not empty
        res.send(products);
    } else {
        res.send({ result: "no product found" })
    }
})

// delete api
app.delete("/products/:id",verifyToken, async (req, res) => {

    const result = await Product.deleteOne({ _id: req.params.id })
    res.send(result)

})

//get to update product
//http://127.0.0.1:5500/products/65168578497d74d43ca8b298
app.get('/products/:id',verifyToken, async (req, res) => {
    const result = await Product.find({ _id: req.params.id });
    if (result.length > 0) {
        res.send(result);
    } else {
        res.send({ result: "no result found" })
    }
})

//finding product

//update product
app.put('/products/:id',verifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id }, {
        $set: req.body
    }
    )
    res.send(result);
})

app.get('/search/:key',verifyToken, async (req, res) => {
    const result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { brand: { $regex: req.params.key } }
        ]
    })
    res.send(result)
})


// now let's create a middlewere and apply it into api for jwt authentication

function verifyToken(req, res, next) {
    let token=req.headers['authorization']
    if(token){
        token= token.split(' ')[1];
        jwt.verify(token,jwtkey,(err,success)=>{
            if(err){
                res.send({result :'not authenticated user'});
            }else{
                next();
            }
        })
    }else{
        res.send({result:'plese send token wtih header'})
    }
   
}

app.listen(5500, () => {

    console.log('listening at port 5500')
})

