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

router.delete('/blogs/:blogId', authenticate, authorize, blogController.deleteBlog)

// router.delete("/blogs", authenticate, authorize, blogController.deleteBlogs)

module.exports = router 