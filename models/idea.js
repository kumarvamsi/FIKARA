//requiring mongoose ODM
const mongoose = require("mongoose");


// idea schema
var ideaSchema = new mongoose.Schema({
    title :String,
    description :{type:String,required:true},
    created :{
        type:Date,
        default:Date.now
    },
    author :{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        username:String
    },
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

// idea model

var Idea = mongoose.model("Idea",ideaSchema);

//exporting 
module.exports = Idea;