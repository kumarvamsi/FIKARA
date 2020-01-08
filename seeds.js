//basic setUp
const mongoose = require("mongoose");
      Idea     = require("./models/idea");
      Comment  = require("./models/comment");
      

//creating arry of objects
var data=[
    {
        title:"delivery app",
        description:"app for deliverying food"
    },
    {
        title:"editing app",
        description:"app for editing pictures"
    },
    {
        title:"chatting app",
        description:"app for chatting with friends"
    }
]      

//removing everything insise the Idea collection
function seedDB(){
    Idea.deleteMany({},function(err){
        // if(err){
        //     console.log("something went wrong!!!");
        // }else{
        //     console.log("removed sucessfully");
        //     data .forEach(function(seed){
        //         Idea.create(seed,function(err,idea){
        //             if(err){
        //                 console.log(err);
        //             }else{
        //                 console.log("added to database");
        //                 //adding comments to the idea 
        //                 Comment.create({
        //                     author:"steele",
        //                     text : "awesome mobile app idea"
        //                 },function(err,comment){
        //                     if(err){
        //                         console.log(err);
        //                     }else{
        //                         //associating comments with idea
        //                         idea.comments.push(comment); //idea taken from the Idea.create(seed,function(err,idea){
        //                         //saving associated comments to database
        //                         idea.save();
        //                         console.log("created a new comment to ideas");
        //                     }
        //                 })
        //             }
        //         });
        //     });
        // }
    }); 

    //adding data to the Idea colllection 
    
  }     
 
  //exporting seedDB function to the app.js
  module.exports = seedDB;
