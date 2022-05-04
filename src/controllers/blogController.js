const { default: mongoose } = require("mongoose");
const authorModel = require("../models/authorModel");
const blogModel = require("../models/blogModel")

//######################################################################################################################
let keyValid = function (value) {
    if (typeof (value) == "undefined" || typeof (value) == null) { return true }
    if (typeof (value) === "string" && value.trim().length == 0) { return true }
    return false
} 

let validRequestBody = function (reqBody) {
    return Object.keys(reqBody).length > 0
}

let validObjectId = function (authorId) {
    return mongoose.isValidObjectId(authorId)     //mongoose.Types.ObjectId.isValid(authorId)    
}

//######################################################################################################################
const createBlog = async (req, res) => {
    try {
        const data = req.body
        if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to create blog" })

        let { authorId, title, body, tags, category, subcategory, isPublished } = data

        if (tags) {   //array   , string ,object string
            if (Array.isArray(tags)) tags = tags.map(el => el.trim()).filter(el => el)
            if (Object.prototype.toString.call(tags) === "[object String]") tags = tags.trim()
        }
        if (subcategory) {
            if (Array.isArray(subcategory)) subcategory = subcategory.map(el => el.trim()).filter(el => el)
            if (Object.prototype.toString.call(subcategory) === "[object String]") subcategory = subcategory.trim()
        }
        data.tags = tags
        data.subcategory = subcategory

        if (!title) return res.status(400).send({ Message: "Title is required...!" });
        if (keyValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })

        if (!authorId) return res.status(400).send({ Message: "authorId is required...!" });
        if (!validObjectId(authorId)) return res.status(400).send({ status: false, Message: `${authorId} -> Author Id should be valid` })
        const validAuthorId = await authorModel.findById(authorId)
        if (!validAuthorId) return res.status(400).send({ status: false, Message: "Author Does not exist" })

        if (!body) return res.status(400).send({ Message: "Body is required...!" });
        if (keyValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })

        if (!category) return res.status(400).send({ Message: "Category is required...!" });
        if (keyValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })

        let repeativeData = await blogModel.find({ body: body }) 
        if (!repeativeData.length == 0) return res.status(400).send({ status: false, Message: "you are creating repeative blog again with same body" })

        let createdBlog = await blogModel.create(data)
        isPublished ? createdBlog.publishedAt = new Date() : createdBlog.publishedAt = null
        createdBlog.save()
        return res.status(201).send({ status: true, Message: "New Blog Created Successfully", data: createdBlog })
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}
//######################################################################################################################
const getblog = async (req, res) => {
    try {
        const data = req.query
        const blogs = { isDeleted: false, deletedAt: null, isPublished: true }
        if (validRequestBody(data)) {
            const { authorId, category, tags, subcategory } = data
            if (authorId)
                if (!keyValid(authorId) && validObjectId(authorId)) { blogs.authorId = authorId }
            if (category)
                if (!keyValid(category)) { blogs.category = category.trim() }
            if (tags)
                if (!keyValid(tags)) {
                    const tagsArray = tags.trim().split(",").map(tags => tags.trim())
                    blogs.tags = { $all: tagsArray }
                }
            if (subcategory)
                if (!keyValid(subcategory)) {
                    const subcategoryArray = subcategory.trim().split(",").map(subcategory => subcategory.trim())
                    blogs.subcategory = { $all: subcategoryArray }
                }
        }
        let getBlogs = await blogModel.find(blogs)
        if (getBlogs.length == 0) return res.status(400).send({ status: false, Message: "No blog found" })
        return res.status(200).send({ status: true, Message: "Blog list", data: getBlogs })

    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}
//######################################################################################################################

let updateBlog = async (req, res) => {
    try {
        let data = req.body
        let blogId = req.params.blogId

        let { title, body, category, subcategory, tags, isPublished } = data

        if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to Update blog" })

        if (!validObjectId(blogId)) return res.status(400).send({ status: false, Message: "BlogId is not valid" })

        if (tags != undefined) {
            if (Array.isArray(tags)) tags = tags.map(el => el.trim()).filter(el => el)
            if (Object.prototype.toString.call(tags) === "[object String]") tags = tags.trim()
        }

        if (subcategory != undefined) {
            if (Array.isArray(subcategory)) subcategory = subcategory.map(el => el.trim()).filter(el => el)
            if (Object.prototype.toString.call(subcategory) === "[object String]") subcategory = subcategory.trim()
        }

        if (title != undefined) {
            title = title.trim()
            if (keyValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })
        }
        if (body != undefined) {
            body = body.trim()
            if (keyValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })
        }

        if (category != undefined) {
            category = category.trim()
            if (keyValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })
        }

        let updatedBlog = await blogModel.findByIdAndUpdate({ _id: blogId }, { $set: { title: title, body: body, category: category }, $addToSet: { subcategory: subcategory, tags: tags } }, { new: true })

        isPublished ? updatedBlog.publishedAt = new Date() : updatedBlog.publishedAt = null
        updatedBlog.save()
        res.status(200).send({ status: true, message: "Blog update is successful", data: updatedBlog })
    } catch (err) {
        res.status(500).send({ Error: err.message })
    }
}


//######################################################################################################################
let deleteBlog = async (req, res) => {
    try {
        const params = req.params
        const blogId = params.blogId
        const authorIdFromToken = req.decodedAuthorId

        if (!validObjectId(blogId)) return res.status(400).send({ status: false, Message: `${blogId} is not a valid Blog Id` })
        if (!validObjectId(authorIdFromToken)) return res.status(400).send({ status: false, Message: `${authorIdFromToken} is not a valid token Id` })

        let blog = await blogModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null });
        if (!blog) return res.status(404).send({ status: false, Message: "Blog not found" });

        if (blog.authorId.toString() !== authorIdFromToken) return res.status(401).send({ status: false, Message: "Unauthorised access! Owner info does not match" })

        await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, Message: "Blog deleted successfully" })
    }
    catch (error) {
        res.status(500).send({ status: false, Message: "Error", error: error.message })
    }
}
//######################################################################################################################
const deleteBlogs = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false   }//, deletedAt: null }
        const queryParams = req.query
        const authorIdFromToken = req.decodedAuthorId

        if (!validRequestBody(queryParams)) return res.status(400).send({ status: false, Message: 'No query param received,aborting delete operation' })

        const { authorId, category, tags, subcategory, isPublished } = queryParams

        if (authorId != undefined)
            if (keyValid(authorId) && validObjectId(authorId)) filterQuery['authorId'] = authorId
            
        if (category != undefined)
            if (keyValid(category)) filterQuery['category'] = category
            
        if (isPublished != undefined)
            if (keyValid(isPublished)) filterQuery['isPublished'] = isPublished
            
        if (tags != undefined)
            if (keyValid(tags)) {
                const tagsArr = tags.trim().split('.').map(tag => tag.trim())
                filterQuery['tags'] = { $all: tagsArr }
            }
        if (subcategory != undefined)
            if (keyValid(subcategory)) {
                const subcategoryArray = subcategory.trim().split('.').map(subcat => subcat.trim())
                filterQuery['subcategory'] = { $all: subcategoryArray }
            }

        const blogs = await blogModel.find(filterQuery)

        if (blogs.length === 0) return res.status(404).send({ staus: false, Message: "No matching blogs found" })

        const idOfBlogsToDelete = blogs.map(blogs => {if (blogs.authorId.toString() === authorIdFromToken) return blogs._id})
        if (idOfBlogsToDelete.length === 0) return res.status(404).send({ status: false, Message: "No blogs found" })
    

        await blogModel.updateMany({ _id: { $in: idOfBlogsToDelete } }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({status:true,Message:"Blog(s) deleted successfully"})
    }
    catch (err) {
        res.status(500).send({ status: false, Message: "Error", error: err.message })
    }
}

//######################################################################################################################
module.exports = { createBlog, getblog, deleteBlogs, updateBlog, deleteBlog }
