const mongoose=require('mongoose')

const postschema = mongoose.Schema({
	postcontent: String,
	imageurl: String,
	Userid: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
	postdate: {
		type: Date,
		default: Date.now(),
	},
	likes: {
		type: Array,
		default: [],
	},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
});

module.exports=mongoose.model('posts',postschema)