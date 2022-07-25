const authorModel = require('../models/authorModel')
const jwt = require("jsonwebtoken")

let keyValid = (value) => {
    if (typeof (value) == "undefined" || typeof (value) == null) return false
    if (typeof (value) === "string" && value.trim().length == 0) return false
    return true
}

let validTitle = (value) => {
    return ["Mr", "Mrs", "Miss"].indexOf(value.trim()) !== -1
}

let validRequestBody = (value) => {
    return Object.keys(value).length > 0
}

let createAuthor = async (req, res) => {
    try {
        let data = req.body
        const { fname, lname, title, email, password } = data
        if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Invalid Request Parameter ,Please provide Author Details" })

        if (!fname) return res.status(400).send({ status: false, Message: "fname is required...." });
        if (!lname) return res.status(400).send({ status: false, Message: "lname is required...." });
        if (!title) return res.status(400).send({ status: false, Message: "title is required...." });
        if (!email) return res.status(400).send({ status: false, Message: "email is required...." });
        if (!password) return res.status(400).send({ status: false, Message: "password is required....." });

        if (!/^[a-zA-Z ]+$/.test(fname)) return res.status(400).send({ status: false, Message: "fname should be valid" })
        if (!/^[a-zA-Z ]+$/.test(lname)) return res.status(400).send({ status: false, Message: "lname should be valid" })
        if (!validTitle(title)) return res.status(400).send({ status: false, Message: `${title}  -> title should be valid` })
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) return res.status(400).send({ status: false, Message: "Invalid email format" })
        if (!keyValid(password)) return res.status(400).send({ status: false, Message: "password should be valid" })

        const isEmailExist = await authorModel.findOne({ email: email })
        if (isEmailExist) return res.status(400).send({ status: false, Message: "Email already exist" })

        const createdAuthor = await authorModel.create(data)
        return res.status(201).send({ status: true, Message: "Author Created Sucessfully", data: createdAuthor })
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

let loginAuthor = async (req, res) => {
    let data = req.body
    let { email, password } = data
    if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Invalid Request Parameter ,Please provide Login Details" })

    if (!email) return res.status(400).send({ status: false, Message: "email is required...." });
    if (!password) return res.status(400).send({ status: false, Message: "password is required....." });

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) return res.status(400).send({ status: false, Message: "Email Address should be valid" })
    if (keyValid(password)) return res.status(400).send({ status: false, Message: "password should be valid" })

    let validAuthor = await authorModel.findOne({ email: email, password: password })
    if (!validAuthor) return res.status(400).send({ status: false, Message: "Wrong login Credentials" })

    let authorId = validAuthor._id
    let token = jwt.sign({ authorId: authorId }, "BloggingSite_Project1")
    return res.status(201).send({ status: true, Message: "Author Login Successfully", data: { token } })
}

module.exports.createAuthor = createAuthor
module.exports.loginAuthor = loginAuthor

