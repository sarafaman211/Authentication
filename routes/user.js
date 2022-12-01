const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const sendMail = require("../utils/sendMail")
const auth = require("../middleware/auth")
const authAdmin = require("../middleware/authAdmin")

router.post("/register", async( req, res ) => {
   
    try {

        const { name, email, password } = req.body
        
        if( !name || !email || !password ) return res.status(400).json({ 
            success: false,
            message: "fill all the fields"
         })

         if(!validateEmail(email)) return res.status(400).json({ 
            success: false,
            message: "Invalid Emails"
         })

         
         let user = await User.findOne({ email })
         if(user){
             return  res.status(400).json({ 
                 success: false,
                 message: "Email already exists !!"
                })
            }
            
            if(password.length < 6) return res.status(400).json({ 
               success: false,
               message: "Password should be atleast 6 character"
            })


        const salt =  await bcrypt.genSalt(12)
        const hashPassword = await bcrypt.hash( password, salt )

       const newUser = {
            name, email, password: hashPassword
        }

        const authToken = createActivatioToken(newUser)

        const url = `${ process.env.CLIENT_URL }/user/register/${ authToken }`

        sendMail( email, url, "Verify your email address" )


        res.json({
            success: true,
            message: "resgistration Success . Please validate your email address to star",
            newUser, authToken
        })

        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({ message: "INTERNAL ERROR OCCURED" })
        
    }

})

router.post("/activateEmail", async ( req, res ) => {

    try {

        const { authToken } = req.body

        const user = jwt.verify( authToken, process.env.TOKEN_KEY )

        const { name, email, password } = user

        const check = await User.findOne({ email })
        if(check){
            return res.status(400).json({
                success: false,
                message: "This Email is already exits"
            })
        }

        const newUser = await User({
            name , email, password
        })

        const saveUser = await newUser.save()


        res.json({
            success: true,
            message: "Your Email activation is done",
            newUser,saveUser
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED",
        })
    }

})

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })
        if(!user) return res.status(400).json({ 
            success: false,
            message: "This email doesn't exists !!!"
         })

         const comparePassword = await bcrypt.compare( password, user.password )
         if(!comparePassword) return res.status(400).json({ 
            success: false,
            message: "Your password is incorrect please fill the corrent credentials"
          })

          const refresh_token = createRefreshToken({id: user._id})
          res.cookie('refreshtoken', refresh_token, {
              httpOnly: true,
              path: '/user/refresh_token',
              maxAge: 7*24*60*60*1000 // 7 days
          })

          res.json({ message: "login success !!!" })
         
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED",
        })
    }

})


router.post("/refresh_token", (req, res) => {
    try {

        const rf_token = req.cookies.refreshtoken
        if(!rf_token) return res.status(400).json({
            success: false,
            message: "login now !!!"
        })

        jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, ( err, user ) => {
            if(err) return res.status(400),json({
                success: false,
                message: err.message
            })

            // console.log(user)
            const access_token = createAccessToken({id: user.id})
            res.json({access_token})
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED",
        })
    }
})


router.post("/forgotPassword", async (req,res) => {

    try {

        const { email } = req.body

        const user = await User.findOne({ email })
        if(!user) return res.status(400).json({
            success: false,
            message: "This email dosen't exits !!"
        })

        const access_token = createAccessToken({ id: user._id })

        const url =  `${ process.env.CLIENT_URL }/user/reset/${ access_token } `

        sendMail( email, url , "Reset your password" )

        res.json({
            success: true,
            message: "Verify your email please !!!1"
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
        
    }

})

router.post("/resetPassword", auth, async( req, res ) => {

    try {

        const {password} = req.body
            // console.log(password)
        const passwordHash = await bcrypt.hash(password, 12)

         await User.findOneAndUpdate({ _id: req.user.id }, {
           password: passwordHash
        })

            res.json({msg: "Password successfully changed!"})
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }

})

router.get("/getUserInfo",auth, async ( req,res ) => {
    try {

        const user = await User.findById( req.user.id ).select("-password")

        res.json({
            success: true,
            user
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }
})

router.get('/getAdminInfo', auth, authAdmin, async (req, res) => {

    try {

        const adminUser = await User.find().select("-password")

        res.json({
            success: true,
            adminUser
        })
        
    } catch (err) {
        console.error({ messsge: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }

} )

router.get("/logout", async( req, res) => {
    try {

        res.clearCookie("refreshtoken", {
            path: '/user/refresh_token'
        })

        res.json({ message: "Logged out ...." })
        
    } catch (err) {
        console.error({ messsge: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }
})

router.patch("/updateUser", auth, async (req,res) =>{

    try {

        const { name, avatar } = req.body
        await User.findOneAndUpdate({ _id: req.user.id }, {
            name, avatar
        })

        res.json({
            success: true,
            message: "Update success"
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({ 
            message: "INTERNAL ERROR OCCURED"
         })
    }

})

router.patch("/updateUserRole/:id", auth, authAdmin, async (req, res) => {

    try {

        const { role } = req.body
        await User.findOneAndUpdate({ _id: req.params.id }, {
            role
        })

        res.json({
            success: true,
            message: "Update user role successfully"
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }

})

router.delete('/deleteUser/:id', auth, authAdmin, async (req,res)=>{

    try {

        await User.findByIdAndDelete(req.params.id)

        res.json({
            success: true,
            message: "User deleted"
        })
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }

})



// functions

const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };

  const createActivatioToken = (payload) => {
    return jwt.sign( payload , process.env.TOKEN_KEY, { expiresIn: "5m" } )
  }
  const createAccessToken = (payload) => {
    return jwt.sign( payload , process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" } )
  }

  const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

module.exports = router