//import the model
const Todo = require("../models/User");

//define route handler


exports.createUser = async(req, res)=>{
    try{
         //extract title and description from request body
         const {rollno,name,course,email,phoneno}= req.body;
         
         //create a new TOdo obj and  insert in db
         const response=await User.create({rollno,name,course,email,phoneno});
            console.log(response);
        
         //send a json response  with a success flag
         res.status(200).json(
            {
                success:true,
                data:response,
                message:"Todo created successfully"
            }
         );
    }   
    catch(err){
        console.error(err);
        console.log(err);
        res.status(500).json({
            success: false,
            data :"internal server error",
            message:err.message,
        })
    
    }
}
