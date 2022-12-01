const User = require("../models/User")

const authAdmin = async ( req, res, next ) =>{

    try {

        const user = await User.findOne({ _id: req.user.id })

        if(user.role !== 1){
            return res.status(400).json({
                message: "Admin resources denied !!!"
            })
        }

        next()
        
    } catch (err) {
        console.error({ message: err.message })
        res.status(500).json({
            message: "INTERNAL ERROR OCCURED"
        })
    }

}

module.exports = authAdmin