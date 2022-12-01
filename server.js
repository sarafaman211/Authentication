const express = require("express")
const dotEnv = require("dotenv")
const colors = require("colors")
const cors = require("cors")
const db = require("./db")
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload")

dotEnv.config({ path: "./.env" })

const port = process.env.PORT || 5000
const app = express()

db()

app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(fileUpload({
    useTempFiles: true
}))

app.use('/user', require("./routes/user"))
app.use('/api', require("./routes/upload"))

app.listen(port, () => {
    console.log(` server connected in port ${ port } `.america)
})