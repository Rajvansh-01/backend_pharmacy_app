const express = require("express");
const router = express.Router();

const UserController = require("../controllers/userController.js");
const checkUserAuth = require("../middlewares/auth_middleware.js");
const messageController = require("../controllers/messageController");

//Route Level Middleware - To protect Route
router.use("/changepassword", checkUserAuth); //Run checkUserAuth middleware if user accesses /changepassword route
router.use("/loggeduser", checkUserAuth); //Display Only authenticated user's data

//Public Routes - can be accessed without logging in
router.post("/register", UserController.userRegistration); //This function runs the registration process written in userController.js file
router.post("/login", UserController.userLogin); //This func runs the login process
router.post("/send-reset-password-email", UserController.sendUserPasswordResetEmail);
router.post("/reset-password/:id/:token", UserController.userPasswordReset); //This func runs when user successfully changes password

//Protected Private Routes  (To protect these routes, we create a middleware that checks authenticity of the logged in user and let's them access these routes)
router.post("/changepassword", UserController.changeUserPassword); //This runs the changeUserPassword block in userController
router.get("/loggeduser", UserController.loggedUser); //This runs the loggedUser block if successfully logged in

router.post('/signupOTP', UserController.userSignupOTP);
router.post('/signupOTP/verify', UserController.verifyOtp);

router.get("/allusers/:id", UserController.getAllUsers);

router.post("/getmsg/", messageController.getMessages);
router.post("/addmsg/", messageController.addMessage);

module.exports = router;
