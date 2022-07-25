let jwt = require("jsonwebtoken")
const blogModel = require("../models/blogModel")

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

let authenticate = async function (req, res, next) {
    try {
        const token = req.headers["x-api-key"]
        if (!token) return res.status(403).send({ status: false, message: "Authentication failed" })

        let decodedToken = jwt.verify(token, "BloggingSite_Project1")

        if (!decodedToken) return res.status(400).send({ status: false, message: "Token is invalid" })

        // ------setting userId in the req---------
        req.authorId = decodedToken.authorId
        next()
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

let authorize = async function (req, res, next) {
    try {
        const blogId = req.params.blogId
        if (!validObjectId(blogId)) return res.status(400).send({ status: false, Message: "BlogId is not valid" })

        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false })
        if (!blog) return res.status(404).send({ status: false, message: "No blog exists with this id or the blog is deleted" })

        if (req.authorId != blog.authorId) return res.status(403).send({ status: false, message: "You are not Authorized" })
        next()
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message })
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

module.exports = { authenticate, authorize }