const mongoose=require('mongoose');
const jobsSchema=mongoose.Schema({
jobtitle:String,
jobdescription:String,
numofApplicants:[{type:mongoose.Schema.Types.ObjectId,ref:'users'}],
joblocation:String,
dateofpost:{
    type:Date,
    default:Date.now()
},
companyid:{type:mongoose.Schema.Types.ObjectId},
jobmode:String,
jobtype:String

})
module.exports=mongoose.model('jobs',jobsSchema)