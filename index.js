const express=require("express");
const mongoose=require("mongoose");
const bodyparser=require("body-parser");
const cookieparser=require("cookie-parser");
const db=require('./config/config').get(process.env.NODE_ENV);
const jwt=require('jsonwebtoken');

const User=require('./models/user');
const {auth} =require('./middlewares/auth');
const user = require("./models/user");

const app=express();

//app use
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use(cookieparser());

app.get('/',function(req,res){
    res.status(200).send("Welcome to login,sign-up api");
});

//database connection
mongoose.Promise=global.Promise;
mongoose.connect(db.DATABASE,{useNewUrlParser:true,useUnifiedTopology:true},function(err){
    if(err) console.log(err);
    console.log("database is connected");
});

//listening port
const port=process.env.PORT||8000;
app.listen(port,()=>{
    console.log('app is live at port ${port}');
});

//adding new user
app.post('/api/register',function(req,res){
    //takiing a user
    const newuser=new User(req.body);

    if(newuser.password!=newuser.password2)return res.status(400).json({message:"password not matched"});

    User.findOne({email:newuser.email},function(err,user){
        if(user) return res.status(400).json({auth:false,message:"email exists"});

        newuser.save((err,doc)=>{
            if(err) {console.log(err);
                return res.status(400).json({success:false});}
            res.status(200).json({
                success:true,
                user:doc
            })
        })
    })
});

//login user

app.post('/api/login',function(req,res){
    let token =req.cookies.auth;
    console.log("token : "+token);

    if(token){
    console.log(token);
    User.findByToken(token,(err,user)=>{
        console.log("inside findByToken");
        if(err) return res(err);
        if(user) return res.status(400).json({
            error:true,
            message:"You are already logged in"
        });

        else{
            User.findOne({'email':req.body.email},function(err,user){
                if(!user) return res.json({isAuth:false,message:'Auth failed,email not found'});

                user.comparepassword(req.body.password,(err,isMatched)=>{
                    if(!isMatched) return res.json({isAuth:false,message:"password doesn't match"});

                    user.generateToken((err,user)=>{
                        if(err) return res.status(400).send(err);
                        res.cookie('auth',user.token).json({
                            isAuth:true,
                            id:user._id,
                            email:user.email
                        })
                    })
                })
            })
        }
    })
}else{
    console.log("inside else block");
        User.findOne({'email':req.body.email},function(err,user){
            if(!user) return res.json({isAuth:false,message:'Auth failed,email not found'});

            user.comparepassword(req.body.password,(err,isMatched)=>{
                if(!isMatched) return res.json({isAuth:false,message:"password doesn't match"});

                user.generateToken((err,user)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',user.token).json({
                        isAuth:true,
                        id:user._id,
                        email:user.email
                    })
                })
            })
        })
}
})


//get logged in user data

app.get('/api/profile',auth,function(req,res){
    try{
    return res.json({
        isAuth:true,
        id:req.user._id,
        email:req.user.email,
        name:req.user.first_name+req.user.last_name
    })
}catch(e){
    console.log(e);
}
})

//auth

//log out user

app.get('/api/logout',auth,function(req,res){
    req.user.deleteToken(req.token,(err,user)=>{
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    })
})
