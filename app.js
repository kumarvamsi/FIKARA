//basic setUp
   const  express      = require("express");
              app      = express();
              ejs      = require("ejs");
       bodyParser      = require("body-parser");
         mongoose      = require("mongoose");
   methodOverride      = require("method-override");
 expressSanitizer      = require("express-sanitizer");
             Idea      = require("./models/idea");
          Comment      = require("./models/comment");  
             User      = require("./models/user"); 
           seedDB      = require("./seeds")
           moment      = require("moment");
            async      = require("async");
            flash      = require("connect-flash");
           crypto      = require("crypto"); 
         passport      = require("passport");
       nodemailer      = require("nodemailer");   
    LocalStrategy      = require("passport-local");
 passportLocalMongoose = require("passport-local-mongoose");   

  //database connection
  // mongodb://localhost/explodeApp
 var db = mongoose.connect("mongodb://admin:admin123@ds135760.mlab.com:35760/vamshi123",{useNewUrlParser:true,useUnifiedTopology:true},function(err){
  if(!err){
      console.log("explodeApp connected to the database");
  } 
})

//configuring dotenv package and locus
require('dotenv').config();

 //express config
 app.use(bodyParser.urlencoded({extended:true}));
 app.use(expressSanitizer());
 app.use(flash());
 app.set("view engine","ejs");  
 app.use(express.static(__dirname + '/public'));
 app.use(methodOverride("_method"));
//  seedDB(); 
//initializing pasport
 app.use(require("express-session")({
     secret:"Explode your thoughts",
     resave: false,
     saveUninitialized: false

 }));
 app.use(passport.initialize());
 app.use(passport.session());

 passport.use(new LocalStrategy(User.authenticate()));
//encoding and decoding data in the session
 passport.serializeUser(User.serializeUser());//taking data from the session
 //invloves the process of encoding 
 passport.deserializeUser(User.deserializeUser());//reading data from the session
 //process of decoding data from the session

 // rendering currentUser to every route
 app.use(function(req, res, next){
    res.locals.currentUser = req.body.User;
    // res.locals.message = req.flash("error");
    next();
});


 
//fuzzy search
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
 //================        =======================
 //RESTful routes  ------- //ideas routes
 //=================       =======================

 //landing route

 app.get("/",function(req,res){
   
   User.findById({_id:"5e14e5a608cb2a44a0b8cab2"},function(err,foundAuthor){
     if(err){
       console.log(err);
     }else{
       Idea.find({},function(err,foundIdeas){
         if(err){
           console.log(err);
         }else{

          res.render("homepage",
          {
            foundAuthor:foundAuthor,
            foundIdeas:foundIdeas,
            currentUser:req.user,
            success:req.flash("success"),
            deletedProfile:req.flash("deletedProfile"),
            welcomeBack:req.flash("welcomeBack"),
            permission:req.flash("permission"),
            commentPermission:req.flash("commentPermission")
           });
     
          }
     

         }
       )}

        })
     
 });
 app.get("/search",isLoggedIn,function(req,res){
   res.render("ideas/searchpage",{currentUser:req.user});
   
 });
 
 //index route
 app.get("/ideas",function(req,res){
    //retriving data from the database 
    // eval(require("locus"));
    var noMatch;
    if(req.query.search){
      const regex = new RegExp(escapeRegex(req.query.search),'gi');
      Idea.find({title:regex},function(err,foundIdeas){
        if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
        }else{
         
          var noMatch;
          if(foundIdeas.length < 1){
            var noMatch = "no ideas found for your search" ;
          }
            
            res.render("ideas/viewideaspage",{foundIdeas:foundIdeas,currentUser:req.user,noMatch:noMatch,success:req.flash("success"),deletedIdea:req.flash("deletedIdea")});
        }
    });

    }else{
      //retrieve  all the ideas
      
      Idea.find({},function(err,foundIdeas){
        if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
        }else{
            
            res.render("ideas/viewideaspage",{foundIdeas:foundIdeas,currentUser:req.user,noMatch:noMatch,success:req.flash("success"),deletedIdea:req.flash("deletedIdea")});
        }
    });
    }
    
 });

 //create route
 app.post("/ideas",isLoggedIn,function(req,res){
    //sanitizing the description
    req.body.description = req.sanitize(req.body.description);
    //creating data
    var title = req.body.title;
    var desc  = req.body.description;
    var author = {
      id: req.user._id,
      username : req.user.username 
    }
    var ideas = {title: title, description: desc, author: author};
    Idea.create((ideas),function(err,newIdea){
        if(err){
           console.log("Yoe something went wrong!!!");
           console.log(err);
        }else{
            req.flash("success","your idea has been posted");
            res.redirect("/ideas");
        }
    });
});
 
 //sending form for creating idea
 app.get("/ideas/new",isLoggedIn,function(req,res){
     res.render("ideas/newideapage",{currentUser:req.user});
 });

 //showing idea route
 app.get("/ideas/:id",isLoggedIn,function(req,res){
     //finding idea using id
     Idea.findById(req.params.id).populate("comments").exec(function(err,foundIdea){
         if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
         }else{
             res.render("ideas/showideapage",
             {
               idea:foundIdea,
               currentUser:req.user,
               commentSuccess:req.flash("commentSuccess"),
               updatedComment:req.flash("updatedComment"),
               deletedComment:req.flash("deletedComment"),
               updatedIdea:req.flash("updatedIdea")
            });
         }
     });
 });

 //edit route
 app.get("/ideas/:id/edit",checkIdeaOwnership,function(req,res){
   //finding idea using id
   Idea.findById(req.params.id,function(err,editIdea){ 
    res.render("ideas/editideapage",{idea:editIdea,currentUser:req.user});
      });
 });

//update route
app.put("/ideas/:id",checkIdeaOwnership,function(req,res){
    //sanitizing the description
    req.body.description = req.sanitize(req.body.description);
    //finding the idea using idea and updating with new data
    Idea.findByIdAndUpdate(req.params.id,req.body.idea,function(err,updatedIdea){
        if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
        }else{
            req.flash("updatedIdea","your idea has been updated");
            res.redirect("/ideas/"+ req.params.id);
        }

    });
});

//delete route
app.delete("/ideas/:id",checkIdeaOwnership,function(req,res){
    Idea.findByIdAndRemove(req.params.id,function(err){
        if(err){
            res.redirect("/ideas");
        }else{
            req.flash("deletedIdea","your idea has been deleted");
            res.redirect("/ideas");
        }
    });
});
//================
//profile routes
//=================
//profile route
app.get("/users/:id",isLoggedIn,function(req,res){

  Idea.find({},function(err,foundIdea){
    if(err){
      console.log(err);
      res.redirect("/");
    }
    res.render("users/profilepage",{user:foundIdea,currentUser:req.user,updatedProfile:req.flash("updatedProfile")});
  })
 
})

//user(3rd) profile
app.get("/user/:id",function(req,res){

   User.findById(req.params.id,function(err,foundAuthor){
   if(err){
     console.log(err);
   }else{
     Idea.find({},function(err,foundIdeas){
       if(err){
         console.log(err)
       }else{
        res.render("users/userprofile",{foundAuthor:foundAuthor,foundIdeas:foundIdeas,currentUser:req.user});
        // console.log(foundAuthor);

       }
     })
     
   }
 })
});
//edit profile 
app.get("/users/:id/edit",function(req,res){
  User.findById(req.params.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      res.render("authentication/editprofile",{user:foundUser,currentUser:req.user});
    }
  });
});

app.put("/users/:id",function(req,res){

  User.findByIdAndUpdate(req.params.id,req.body.user,function(err,updatedUser){
    if(err){
      res.redirect("/users/" + req.params.id);
    }else{
      req.flash("updatedProfile","successfully updated your profile");
      res.redirect("/users/" + req.params.id);
    }
  });

});
app.delete("/users/:id",function(req,res){
  User.findByIdAndRemove(req.params.id,{},function(err,deleted){
    if(err){
      console.log(err);
    }else{
      req.flash("deletedProfile","successfully deleted your account")
      res.redirect("/");
    }
  });
});
//============================= 
// comment routes
// ============================

//comment create route
app.get("/ideas/:id/comments/new",isLoggedIn,function(req,res){
    //finding idea using id
    Idea.findById(req.params.id,function(err,foundIdea){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new",{idea:foundIdea,currentUser:req.user});
        }
    });

});

//creating a comment and associating with the post
app.post("/ideas/:id/comments",isLoggedIn,function(req,res){
    //finding idea using id
    Idea.findById(req.params.id,function(err,foundIdea){
        if(err){
            console.log(err);
        }else{
            Comment.create(req.body.comment,function(err,newComment){
                if(err){
                    console.log(err);
                }else{
                    //save the userid with username
                    newComment.author.id = req.user._id;
                    newComment.author.username = req.user.username;
                    //save comment
                    newComment.save();
                    foundIdea.comments.push(newComment);
                    foundIdea.save();
                    req.flash("commentSuccess","your comment has been added");
                    res.redirect("/ideas/" + foundIdea._id)
                }
            });
        }
    });

});
//edit comment from
app.get("/ideas/:id/comments/:comment_id/edit",checkCommentOwnership,function(req,res){
      Comment.findById(req.params.comment_id,function(err,foundComment){
        if(err){
          res.redirect("back");
        }else{
          res.render("comments/editcommentpage",{idea_id:req.params.id, comment:foundComment});
        }
   });
});

//update comment route
app.put("/ideas/:id/comments/:comment_id",checkCommentOwnership,function(req,res){

  Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
    if(err){
      res.redirect("back");
    }else{
      req.flash("updatedComment","successfully updated your comment");
      res.redirect("/ideas/" + req.params.id);
    }
  });

});;

//delete comment route
app.delete("/ideas/:id/comments/:comment_id",checkCommentOwnership,function(req,res){
  Comment.findByIdAndRemove(req.params.comment_id,function(err){
    if(err){
      res.redirect("back");
    }else{
      req.flash("deletedComment","successfully deleted your comment");
      res.redirect("/ideas/" + req.params.id);
    }
  });
});

//=================
//authentication routes
//=================

//register route
app.get("/register",function(req,res){
    res.render("authentication/registerpage",{error:req.flash("error")});
});

//post route(register)
app.post("/register",function(req,res){
    //saving only username,phone,email
    var newUser = new User({username: req.body.username,phonenumber:req.body.phonenumber,email:req.body.email});

    User.register(newUser, req.body.password,function(err,user){
        if(err){
            console.log(err); 
            req.flash("error",err.message);
            return res.render("authentication/registerpage",{error:req.flash("error")});
        }
            passport.authenticate("local")(req,res,function(){
           
            req.flash("success","nice to meet you "+ user.username); 
            req.flash("error",err); 
            res.redirect("/",);
            });
        
       });
});

//login route
app.get("/login",function(req,res){
    res.render("authentication/login",{error: req.flash("error")});
})

//post route (login) 
app.post("/login",passport.authenticate("local",{

    successRedirect: "/",
    failureFlash: true,
    failureRedirect:"/login"

}),function(req,res){

  req.flash("welcomeBack","welcomeback");

});

//logout route
app.get("/logout",function(req,res){

    req.logout();
    req.flash("success","we miss you");
    res.redirect("/");
    
    
});

//middleware to check logged in or not
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","you need to be logged in to do that");
    res.redirect("/login");

}

// forgot password
app.get('/forgot', function(req, res) {
    res.render('authentication/forgot',{mail:req.flash("mail")});
  });
  
  app.post('/forgot',function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          // console.log();
          if (!user) {
            // req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              host: 'smtp.gmail.com',
              port: 587,
              secure: false,
              requireTLS: true,
              user: process.env.EMAIL,
              pass: process.env.PASSWORD
            }
          });
        var mailOptions = {
          from: process.env.EMAIL,
          to: user.email,
          subject: 'FIKARA Password Reset',
          text: 'You are receiving this because you have requested to reset you account password.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport .sendMail(mailOptions, function(err) {
          req.flash("mail","mail sent to " + user.email);
          console.log('mail sent');
          // var email = req.body.email;
          // console.log(email);
        //   req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
  app.get('/reset/:token',function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('authentication/resetpassword', {token: req.params.token});
    });
  });
  
  app.post('/reset/:token',function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            // req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
            //   req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport  = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            user: 'kumarbvamsi@gmail.com',
            pass:'#vamsi1999$'
          }
        });
        var mailOptions = {

          from: 'kumarbvamsi@gmail.com',
          to: user.email,
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport .sendMail(mailOptions, function(err) {
        //   req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/ideas');
    });
  });
  
 //checking ownershipof idea
 function checkIdeaOwnership(req,res,next){
  if(req.isAuthenticated){
      Idea.findById(req.params.id,function(err,editIdea){
        if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
        }else{
            //checking the current user with idea  user
            if(editIdea.author.id.equals(req.user._id)){
              next();
            }else{
              req.flash("permission","you dont have a permission to do that");
              res.redirect("/");
            }
          
          }
       });
    }else{
      
      res.redirect("back");
  }
}
 
 //checking ownership of comment
 function checkCommentOwnership(req,res,next){
  if(req.isAuthenticated){
      Comment.findById(req.params.comment_id,function(err,foundComment){
        if(err){
            console.log("Yoe something went wrong!!!");
            console.log(err);
        }else{
            //checking the current user with idea  user
            if(foundComment.author.id.equals(req.user._id)){
              next();
            }else{
              req.flash("commentPermission","you dont have a permission to do that");
              res.redirect("back");
            }
          
          }
       });
    }else{
      res.redirect("back");
  }
};
 
// footer routes
app.get("/aboutus",function(req,res){
  res.render("footer/aboutUs");
}) 
app.get("/contact",function(req,res){
  res.render("footer/contact");
}) 
app.get("/notes",function(req,res){
  res.render("footer/notes");
})
app.get("/help",function(req,res){
  res.render("footer/help");
})
//error route
app.get("*",function(req,res){
    res.render("error");
});
 
 //server setUp
 app.listen(3000,function(err,res){

    console.log("explodeApp started at 3000");

 });