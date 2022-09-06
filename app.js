//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
const saltRounds = 10;
const validator = require("email-validator");
validator.validate("test@email.com");
ObjectID = require('mongodb').ObjectID;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(session({
  secret: " Our little Secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-devansh:Devansh69@cluster0.vknxdea.mongodb.net/?retryWrites=true&w=majority");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  followers: String,
  following: String
});

const blogSchema = new mongoose.Schema({
  username: String,
  Title: String,
  Message: String,
  PostTime: { type: Date, default: Date.now }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Blog = new mongoose.model("Blog", blogSchema);


passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/blogs", function (req, res) {
  var follower_username = req.user.username;
  var followee_username = req.body.username;
  console.log(follower_username + followee_username);
  Blog.find({ "username": followee_username }, function (err, foundBlogs) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundBlogs) {
        User.updateOne({ "username": follower_username }, { $push: { following: followee_username } }, function (err) {
          if (err) {
            console.log(err);
          }
          else {
            // res.render("blogs", { foundBlogs: foundBlogs });
            User.updateOne({ "username": followee_username }, { $push: { followers: follower_username } }, function (err) {
              if (err) {
                console.log(err);
              }
              else {
                res.render("blogs", { foundBlogs: foundBlogs });
              }
            });
          }
        });
      }
    }
  });
});

app.get("/blogs", function (req, res) {
  var username = req.body.mail;

  Blog.find({ "username": req.user.username, }, function (err, foundBlogs) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundBlogs) {
        res.render("blogs", { foundBlogs: foundBlogs });
      }
    }
  });
});

app.get("/secrets", function (req, res) {
  User.find({ "username": req.user.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        Blog.find(function (err, foundBlogs) {
          if (err) {
            console.log(err);
          }
          else {
            res.render("secrets", { foundUser: foundUser, foundBlogs: foundBlogs });

          }
        });
      }
    }
  });
});

app.get("/sorry", function (req, res) {
  res.render("sorry");
})

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  }
  else {
    res.redirect("/login");
  }
});


app.post("/profile", function (req, res) {
  var username = req.body.mail;
  User.find({ "username": username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {

        Blog.find({ "username": req.user.username }, function (err, foundBlogs) {
          if (err) {
            console.log(err);
          }
          else {
            res.render("profile", { foundUser: foundUser, foundBlogs: foundBlogs });
          }
        })
      }
    }
  });
});

app.get("/profile", function (req, res) {
  var username = req.body.mail;
  User.find({ "username": req.user.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {

        Blog.find({ "username": req.user.username }, function (err, foundBlogs) {
          if (err) {
            console.log(err);
          }
          else {
            res.render("profile", { foundUser: foundUser, foundBlogs: foundBlogs });
          }
        })
      }
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

app.post("/register", function (req, res) {
  if (validator.validate(req.body.username)) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });

  }
  else {
    res.status(400).send('Invalid Email');
  }
});

app.post("/login", passport.authenticate("local"), function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  })
});




app.post("/submit", function (req, res) {
  var new_id = req.user.username;
  var dateTime = new Date();

  const blog = new Blog({
    username: new_id,
    Title: req.body.Title,
    Message: req.body.Message
  });

  blog.save(function (err) {
    if (!err) {
      res.redirect("/secrets");
    }
  })
});




app.listen(process.env.PORT || 3001, function () {
  console.log("Server started on port 3000.");
});
