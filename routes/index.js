const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const userModel = require("./users");
const postModel = require("./post");
const commentModel = require("./comment");
const localstrategy = require("passport-local");
const jobModel = require("./jobs");

passport.use(new localstrategy(userModel.authenticate()));

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/images/uploads");
	},
	filename: function (req, file, cb) {
		// const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage });

router.get("/", function (req, res, next) {
	res.render("index");
});

router.get("/register", function (req, res) {
	res.render("registeroption");
});

router.get("/register/user", function (req, res) {
	res.render("registeruser");
});

router.get("/register/company", function (req, res) {
	res.render("registercompany");
});

router.post("/register/user", upload.single("profileimg"), function (req, res) {
	var data = new userModel({
		profileimg: req.file.filename,
		name: req.body.name,
		username: req.body.username,
		email: req.body.email,
		contact: req.body.contact,
		gender: req.body.gender,
		DOB: req.body.DOB,
		isadmin: false,
		location: req.body.location,
		headline: req.body.headline,
	});
	userModel
		.register(data, req.body.password)
		.then(function (u) {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/feed");
			});
		})
		.catch(function (e) {
			res.send(e);
		});
});

router.get("/feed", isLoggedIn, function (req, res, next) {
	userModel
		.findOne({ username: req.session.passport.user })
		.populate("usersPost")
		.then(function (fU) {
			postModel
				.find()
				.populate("Userid")
				.then(function (allPosts) {
					commentModel
						.find()
						.populate("postid")
						.then(function (forComment) {
							console.log(forComment);
							res.render("feed", { user: fU, allPosts, forComment });
						});
				});
		});
});

router.get("/like/:id", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (likedUser) {
			postModel.findOne({ _id: req.params.id }).then(function (likedPost) {
				if (likedPost.likes.indexOf(likedUser._id) === -1) {
					likedPost.likes.push(likedUser._id);
				} else {
					likedPost.likes.splice(likedPost.likes.indexOf(likedUser._id), 1);
				}
				likedPost.save().then(function (dets) {
					res.redirect("/feed");
				});
				res.redirect(req.headers.referer);
			});
		});
});

router.post("/comment/:id", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (foundUser) {
			postModel.findOne({ _id: req.params.id }).then(function (foundPost) {
				commentModel
					.create({
						text: req.body.comment,
						postid: foundPost._id,
						user: foundUser.name,
					})
					.then(function (createdComment) {
						foundPost.comments.push(createdComment);
						foundPost
							.save()
							.then(function (data) {
								res.redirect("/feed");
							})
							.catch(function (err) {
								res.send("error is : " + err);
							});
					});
			});
		});
});

router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/feed",
		failureRedirect: "/",
	}),
	function (req, res, next) {}
);

router.get("/jobs", isLoggedIn, async function (req, res) {
	// userModel.findOne({username:req.session.passport.user})
	// .then(function(elem){
	//   res.render('jobs');
	// })
	// res.render("alljobs")
	// var data= await jobModel.find()
	// res.send(data)
	res.render("alljobs");
});

router.get("/suggestions/:userid", function (req, res) {
	userModel.findOne({ _id: req.params.userid }).then(function (userfound) {});
});

router.get("/alljobs", isLoggedIn, function (req, res) {
	jobModel.find().then(function (jobsfound) {
		res.send(jobsfound);
	});
});

router.get("/postjob", isLoggedIn, function (req, res) {
	res.render("postjobs");
});

router.post("/postjob", isLoggedIn, function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (dets) {
			jobModel
				.create({
					jobtitle: req.body.jobtitle,
					jobdescription: req.body.jobdescription,
					jobmode: req.body.jobmode,
					joblocation: req.body.joblocation,
					jobtype: req.body.jobtype,
					companyid: dets._id,
				})
				.then(function (params) {
					dets.job.push(params);
					dets.save().then(function (data) {
						res.send(data);
					});
				});
		});
});

router.post("/createpost", upload.single("imageurl"), function (req, res) {
	if (req.file !== undefined) {
		userModel
			.findOne({ username: req.session.passport.user })
			.then(function (founduser) {
				postModel
					.create({
						Userid: founduser,
						postcontent: req.body.postcontent,
						imageurl: req.file.filename,
					})
					.then(function (createdpost) {
						founduser.usersPost.push(createdpost);
						founduser.save().then(function (data) {
							res.redirect("/feed");
						});
					});
			});
	} else {
		userModel
			.findOne({ username: req.session.passport.user })
			.then(function (founduser) {
				postModel
					.create({
						Userid: founduser,
						postcontent: req.body.postcontent,
					})
					.then(function (createdpost) {
						founduser.usersPost.push(createdpost);
						founduser.save().then(function (data) {
							res.redirect("/feed");
						});
					});
			});
	}
});

router.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

router.post("/register/company", function (req, res) {
	var uuu = new userModel({
		name: req.body.name,
		username: req.body.username,
		location: req.body.location,
		websiteUrl: req.body.compnaywebsiteurl,
		contact: req.body.contact,
		headline: req.body.headline,
		email: req.body.email,
		industrydomain: req.body.industrydomain,
		isadmin: true,
	});
	userModel
		.register(uuu, req.body.password)
		.then(function (u) {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/feed");
			});
		})
		.catch(function (e) {
			res.send(e);
		});
});

router.post("/findbycontact", isLoggedIn, function (req, res) {
	res.send("its working");
});

router.get("/user/profile", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (fu) {
			res.render("profile", { foundUser: fu });
		});
});

router.post(
	"/user/profile/setprofileimage",
	upload.single("profileimg"),
	function (req, res) {
		userModel
			.findOne({ username: req.session.passport.user })
			.then(function (dets) {
				dets.profileimg = req.file.filename;
				dets.save().then(function (data) {
					console.log(req.file);
					res.redirect("/user/profile");
				});
			});
	}
);

router.get("/mynetwork", isLoggedIn, function (req, res) {
	userModel.find().then(function (elem) {
		res.render("mynetwork");
	});
});

router.get("/applyjob/:id", isLoggedIn, function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (data) {
			jobModel.findOne({ _id: req.params.id }).then(function (job) {
				job.numofApplicants.push(data);
				job.save().then(function (dta) {
					res.redirect();
				});
			});
		});
});

router.get("/accept/:id", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (elem) {
			userModel.findOne({ _id: req.params.id }).then(function (data) {
				elem.connections.push(data);
				elem.save().then(function () {
					data.connections.push(elem);
					data.save().then(function (params) {
						res.redirect(req.headers.referer);
					});
				});
			});
		});
});

router.get("/reject:id", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (user1) {
			userModel.findOne({ _id: req.params.id }).then(function (user2) {
				var found = user1.connectionrequest.indexof(user2);
				user1.connectionrequest.splice(user2, 1);
				user1.save().then(function () {
					var found2 = user2.connectionrequestsent.indexof(user1);
					user2.connectionrequestsent.splice(found2, 1);
					user2.save().then(function () {
						res.redirect(req.headers.referer);
					});
				});
			});
		});
});

router.get("/connection/:id", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (user1) {
			userModel.findOne({ _id: req.params.id }).then(function (user2) {
				user2.connectionrequest.push(user1);
				user2.save().then(function () {
					user1.connectionrequestsent.push(user2);
					user1.save().then(function () {
						res.redirect(req.headers.referer);
					});
				});
			});
		});
});

router.get("/applyjob/:companyid/:jobid", function (req, res) {
	userModel
		.findOne({ username: req.session.passport.user })
		.then(function (user) {
			jobModel.findone({ _id: req.params.id }).then(function (jobfound) {
				jobsfound.numofApplicants.push(user);
				jobsfound.save().then(function () {
					user.noofjobapplied.push(jobfound);
					user.save().then(function () {
						res.redirect(req.headers.referer);
					});
				});
			});
		});
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect("/");
	}
}

module.exports = router;
