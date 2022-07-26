const express = require('express')
const router = express.Router()

const blogController = require("../controllers/blogController")
const authorController = require("../controllers/authorController")
const { authenticate, authorize } = require("../middleWare/auth")

router.post('/authors', authorController.createAuthor)

router.post("/login", authorController.loginAuthor)

router.post("/blogs", authenticate, blogController.createBlog)

router.get("/getBlogs", authenticate, blogController.getblog)

router.put('/blogs/:blogId', authenticate, authorize, blogController.updateBlog)

router.delete('/blogs/:blogId', authenticate, authorize, blogController.deleteBlogById)

router.delete("/blogs", authenticate, blogController.deleteBlogByQuery)


module.exports = router 
