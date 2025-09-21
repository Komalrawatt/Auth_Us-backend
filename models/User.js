const mongoose= require('mongoose');

const UserSchema= new mongoose.Schema(
    {
        rollno:{
            type:String,
            required:true,
            unique:true,
            
        },
        name:{
            type:String,
            required:true,
            maxlength:30
            
        },
        course:{
                type:String,
                required:true,
        },
        phoneno:{
                type:String,
                required:true,
                maxlength:10
            },
        email:{
                type:String,
                required:true,
        },
        role:{
            type:String,
            required:true,
        },
        performance:{
             type:String,
            required:true,
        }
    }
)

module.exports= mongoose.model("User",UserSchema);