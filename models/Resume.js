const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
{
template:{
type:String,
enum:["template1","template2","template3"],
default:"template1"
},

studentId:{
type:String,
required:true,
unique:true
},

name:{
type:String,
required:true,
trim:true,
match:[/^[A-Za-z\s]+$/,"Name must contain only letters"]
},

email:{
type:String,
required:true
},

phone:String,

linkedin:String,

github:String,

photo:String,

summary:String,

skills:{
type:[String],
default:[]
},

education:String,

college:String,

year:String,

experience:String,

projectName:String,

projectDescription:String,

certifications:String

},
{timestamps:true}
);

module.exports = mongoose.model("Resume",resumeSchema);
