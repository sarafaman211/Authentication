const jwt = require("jsonwebtoken")

const auth = ( req,res,next ) => {

    try {

        const token = req.header("auth-token")
        if(!token) return res.status(400).json({
            message: "No token found ... please login first"
        })
    
        jwt.verify( token, process.env.ACCESS_TOKEN_SECRET, ( err, user ) => {
            if (err) return res.status(400).json({
                message: "No token found ... please login first"
            })
            req.user = user
        } )
    
        next()
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }


}

module.exports = auth