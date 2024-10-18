const express = require('express')
const mongoose = require('mongoose');
require("dotenv").config();
const app = express()


app.get('/',(req,res)=>{
    res.send("Hello form node API Server in");
});

mongoose.connect(process.env.DB_CREDENTIAL)
.then(() => {console.log('Connected to database');
    app.listen(3000,()=>{
        console.log('Server is running on port 3000');
    });
})
.catch(() => console.log('Connection failed'));
