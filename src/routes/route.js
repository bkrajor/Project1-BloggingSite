const express = require('express');
const router = express.Router();

const blogController = require("../controllers/blogController")
const authorController = require("../controllers/authorController")
const middleWare =require("../middleWare/middleWare")

router.post('/Authors',authorController.createAuthor) 

router.post("/Blogs" ,middleWare.authenticate,blogController.createBlog)         

router.get("/getBlogs",middleWare.authenticate,blogController.getblog)    

router.put('/blogs/:blogId' ,middleWare.authenticate, middleWare.authorize,blogController.updateBlog)   

router.delete('/blogs/:blogId',middleWare.authenticate, middleWare.authorize,blogController.deleteBlog)   

router.delete("/blogs",middleWare.authenticate, middleWare.authorize1,blogController.deleteBlogs)   

router.post("/login",authorController.loginAuthor)   


module.exports = router; 