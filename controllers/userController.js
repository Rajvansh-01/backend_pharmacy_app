const UserModel = require("../models/User.js"); //importing user model
const UserModelOTP = require("../models/userModelOTP");
const Otp = require("../models/otpModel.js");
const bcrypt = require("bcrypt"); //Used for password hasing
const jwt = require("jsonwebtoken"); //to generate a token
const transporter = require("../config/emailConfig.js");
const _ = require('lodash');
const axios = require('axios');
const otpGenerator = require('otp-generator');
const fast2sms = require('fast-two-sms');

//User Registration Form
class UserController {
  static userRegistration = async (req, res) => {
    const { name, email, password, password_confirmation, } = req.body; //Data from client side
    const user = await UserModel.findOne({ email: email }); //Checks the email given by user is already in the DB. Allows only unique emails to be registered
    if (user) {
      res.send({ Status: "Failed", Message: "Email already exists" });
    } else {
      //Check if user has provided all fields of data
      if (name && email && password && password_confirmation) {
        //checks if password and password_confirmation are matching
        if (password === password_confirmation) {
          try {
            const salt = await bcrypt.genSalt(10); //Generating a salt for password hashing
            const hashPassword = await bcrypt.hash(password, salt); //Hashing password using salt
            const userData = new UserModel({
              //Saving the user details which are entered
              name: name,
              email: email,
              password: hashPassword, //hashed password is stored in the DB
            });
            await userData.save(); //to save the doc
            const saved_user = await UserModel.findOne({ email: email }); //Obtained user that is been saved

            //---------Generate JWT Token-----------------
            const token = jwt.sign(
              { userID: saved_user._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "5d" }
            ); //Expiry tells in how many days the password expires.   JWT_secret_key is created by us
            res.status(201).send({
              Status: "Success",
              Message: "Registration Success!",
              token: token,
            }); //Sending JWT token to the client user

            res
              .status(201)
              .send({ Status: "Success", Message: "Registration Success!" });
          } catch (error) {
            console.log(error);
            res.send({ Status: "Failed", Message: "Unable to register signup" });
          }
        } else {
          res.send({ Status: "Failed", Message: "Passwords don't match!" });
        }
      } else {
        res.send({ Status: "Failed", Message: "All fields are required!" });
      }
    }
  }; //userRegistration block ends here

  static userSignupOTP = async (req, res) => {
    const { name, email, number } = req.body; //data from client side
    const user = await UserModelOTP.findOne({ email: email }); //Checks the email given by user is already in the DB. Allows only unique emails to be registered
    if (user) {
      res.send({ Status: "Failed", Message: "Email already exists" });
    }
    else {
      if (name && email && number) {
        try {
          const userMobile = await UserModelOTP.findOne({ number: req.body.number });
          const userEmail = await UserModelOTP.findOne({ email: email });
          if (userMobile && userEmail) {
            return res.status(400).send("User already Registered!");
          }
          const OTP = otpGenerator.generate(6, {
            digits: true, alphabets: false, upperCase: false, specialChars: false
          });
          const number = req.body.number;
          console.log(number);
          console.log(OTP);

          const OtpUserData = new UserModelOTP({ name: number, email: email, number: number,  otp: OTP });
          const salt = await bcrypt.genSalt(10);
          OtpUserData.otp = await bcrypt.hash(OtpUserData.otp, salt);
          await OtpUserData.save();
          // res.status(200).send("OTP send successfully");

          // var options = {
          //   authorization : process.env.YOUR_API_KEY , 
          //   message : 'YOUR_MESSAGE_HERE' ,  
          //   numbers : ['7877582704']
          // } 

          //Asynchronous Function.
          // send this message
          fast2sms.sendMessage({
            authorization: process.env.YOUR_API_KEY,
            message: OTP,
            numbers: [number]
          })
            .then((response) => {
              res.send("success");
            })
            .catch((error) => {
              res.send("Some error taken place")
            });
          // console.log("successfully send"); 
          // res.send("otp is: " + responseOfOTP);
        } catch (error) {
          console.log(error);
          res.send({ Status: "Failed", Message: "Unable to register" });
        }
      }
      else {
        res.send({ Status: "Failed", Message: "All Fields are Required!" });
      }
    }
  }; //userRegistration block ends here

  // Verifying the otp 
  static verifyOtp = async (req, res) => {
    const otpHolder = await UserModelOTP.find({
      number: req.body.number
    });
    if (otpHolder.length === 0) return res.status(400).send("You have used expired OTP!");
    const rightOtpFind = otpHolder[otpHolder.length - 1];
    const validUser = await bcrypt.compare(req.body.otp && rightOtpFind.otp);

    if ((rightOtpFind.number === req.body.number) && validUser) {
      const user = new UserModelOTP(_.pick(req, body, ["number"]));
      const token = user.generateJWT();
      const result = await user.save();
      const OTPDelete = await Otp.deleteMany({
        number: rightOtpFind.number
      });
      return res.status(200).send({
        message: "User registration successful!",
        token: token,
        data: result
      });
    } else {
      return res.status(200).send("Wrong OTP!");
    }
  }

  //User Login
  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (email && password) {
        //findOne() - finds one document according to the condition
        const user = await UserModel.findOne({ email: email }); //Checks the email given by user is already in the DB. Allows only those emails which are present in DB
        //if user is registered in DB
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password); //Compares if passsword given by user is equal to password stored in DB
          if (user.email === email && isMatch) {
            //----------GENERATE JWT TOKEN for Successful Login
            const token = jwt.sign(
              { userID: user._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "5d" }
            );
            res.send({
              Status: "Success",
              Message: "Login Successful!",
              token: token,
            }); //Sending JWT token to the client user
          } else {
            res.send({
              Status: "Failed",
              Message: "Email or Password is invalid!",
            });
          }
        } else {
          res.send({
            Status: "Failed",
            Message: "You are not a registered user",
          });
        }
      } else {
        res.send({ Status: "Failed", Message: "All fields are required!" });
      }
    } catch (error) {
      //logs the error message if Email and Password are not stored in the DB
      console.log(error);
      res.send({ Status: "Failed", Message: "Unable to Login!" });
    }
  };

  //Change Password   - Only for logged in Users
  static changeUserPassword = async (req, res) => {
    const { password, password_confirmation } = req.body;
    if (password && password_confirmation) {
      //checking if both password fields are filled by the user
      if (password !== password_confirmation) {
        //Checking if both passwords are same and macth
        res.send({ Status: "Failed", Message: "Passwords don't match!" });
      } else {
        //Hash our password and store it in DB
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt); //Hashing password using salt
        await UserModel.findByIdAndUpdate(req.user._id, {
          $set: { password: newHashPassword },
        }); //update new password in userModel
        res.send({
          Status: "Success",
          Message: "Password changed successfully!",
        });
      }
    } else {
      res.send({ Status: "Failed", Message: "All fields are required!" });
    }
  };

  //Get Logged User Data
  static loggedUser = async (req, res) => {
    res.send({ user: req.user });
  };

  //To send Reset Pasword Mail to the user
  static sendUserPasswordResetEmail = async (req, res) => {
    const { email } = req.body; //get email from user
    if (email) {
      // console.log("level0");
      //check if email is given
      const user = await UserModel.findOne({ email: email }); //check if email given by user and email in DB are same
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY; //Generating another secret key
        const token = jwt.sign({ userID: user._id }, secret, {
          expiresIn: "15m",
        }); //Geneating a JWT Token
        // console.log(token);
        const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`; //Back end link

        //Send RESET Password Email
        let info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "Login Mail",
          html: `<a href="${link}>Click Here</a> to Reset your Password`,
        });
        console.log("leve;3");
        res.send({
          Status: "Success",
          message: "Password Reset email sent... Please Check your Email",
          info: info,
        });
      } else {
        res.send({ Status: "Failed", Message: "Email doesn't exist!" });
      }
    } else {
      res.send({ Status: "Failed", Message: "Email field is required!" });
    }
  };

  //Works when we click on Reset submit button
  static userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body; //req.body - gets data from body form
    const { id, token } = req.params; //params - gets id from url
    const user = await UserModel.findById(id);
    const new_secret = user._id + process.env.JWT_SECRET_KEY; //Generating new Secret
    try {
      jwt.verify(token, new_secret); //Verifying token with new_secret
      if (password && password_confirmation) {
        //Checking if Both are given
        if (password !== password_confirmation) {
          res.send({ Status: "Failed", Message: "Passwords don't match!" });
        } else {
          const salt = await bcrypt.genSalt(10);
          const newHashPassword = await bcrypt.hash(password, salt); //Hashing password using salt
          await UserModel.findByIdAndUpdate(user._id, {
            $set: { password: newHashPassword },
          }); //update new password in userModel
          res.send({
            Status: "Success",
            message: "Password Reset Successful!",
          });
        }
      } else {
        res.send({ Status: "Failed", Message: "All fields are required!" });
      }
    } catch (error) {
      res.send({ Status: "Failed", Message: "Invalid Token!" });
    }
  };

  static getAllUsers = async (req, res, next) => {
    try {
      const users = await UserModel.find({ _id: { $ne: req.params.id } }).select([
        "email",
        "name",
        "_id",
      ]);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  };

}

module.exports = UserController;


// {
//   "name":"nskcnk",
//   "email":"gudcj@hhcik",
//   "password": "kkk",
//   "password_confirmation": "kkk",
//   "role": "{ type: String}",
// "phoneVerified": "{ type: Boolean}",
// "emailVerified": "{ type: Boolean }"
// }

// { 
//   "name":"nskcnk",
//   "email":"gudcj@hhcik",
//   "password": "kkk",
//   "password_confirmation": "kkk",
//   "number": "7877582704"
// }