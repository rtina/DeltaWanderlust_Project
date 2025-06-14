if(process.env.NODE_ENV !== "production"){
  require('dotenv').config()
}
const express =  require ("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
const dbUrl = process.env.ATLASDB_URL
//====================== connection to monngodb=====================
async function main(){
    await mongoose.connect(dbUrl);
}

main().then(()=>{
    console.log("Connection successfull");
}).catch( (err) =>{
    console.log("Connection unsuccefull");
});

// =================setting up the imports stuffs and middlewares===========
app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"public")));

// ====================== Session configuration ======================
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter : 24 * 3600
} );

store.on("error", (err)=>{
  console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  };

// ===================== Flash ans session configuration ======================

  app.use(session(sessionOptions));
  app.use(flash());

//======================= Passport configuration =======================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ======================= root route=======================


app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next(); 
})

// app.get("/demoUser" , async( req,res)=>{
//     let FakeUser = new User({
//         email : "Student@gmail.com",
//         username : "Delta_student"
//     });
//     let newUser = await User.register(FakeUser, "HelloWorld");
//     res.send(`Registered user ${newUser}`);
// });

//========================= Routes ==================

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews/", reviewsRouter );
app.use("/", userRouter);


//======================= Error handling middleware ========================

app.all("*", (req,res,next)=>{
    next(new ExpressError(404, "Page not found"));
});

app.use((err,req,res,next)=>{
    let {statusCode =500 , message = "Somthing went wrong"} = err;
    // res.status(statusCode).send(message);
    res.render("listings/error.ejs",{statusCode,message});
});

app.listen(8083, ()=>{
    console.log("Server is listening to the port no 8083");
});

