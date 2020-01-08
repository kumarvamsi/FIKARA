const  mongoose = require("mongoose");
passportLocalMongoose = require("passport-local-mongoose");   

//creating a user schema with name,phone,email,password
var userSchema = new mongoose.Schema({
    username:{type :String,unique:true,require:true},
    phonenumber:{type :String,unique:true,require:true},
    email:{type: String, unique:true , required: true},
    password:{type :String,unique:true,require:true},
    resetPasswordToken: String, //for resetting the password
    resetPasswordExpires: Date,
    // isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User",userSchema);

//exporting the User model tyo app.js
module.exports = User;