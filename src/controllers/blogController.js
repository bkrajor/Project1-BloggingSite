const authorModel = require("../models/authorModel")
const blogModel = require("../models/blogModel")
const mongoose = require("mongoose")

//######################################################################################################################
let isValid = function (value) {
    if (typeof (value) == "undefined" || typeof (value) == null) return false
    if (typeof (value) === "string" && value.trim().length == 0) return false
    return true
}

let isValidRequestBody = function (reqBody) {
    return Object.keys(reqBody).length > 0
}

let isValidObjectId = function (authorId) {
    return mongoose.isValidObjectId(authorId)
}

//######################################################################################################################
const createBlog = async (req, res) => {
    try {
        const data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to create blog" })

        let { authorId, title, body, category, tags, subcategory, isPublished } = data

        if (!isValid(authorId)) return res.status(400).send({ Message: "authorId is required...!" })
        if (!isValid(title)) return res.status(400).send({ Message: "Title is required...!" })
        if (!isValid(body)) return res.status(400).send({ Message: "Body is required...!" })
        if (!isValid(category)) return res.status(400).send({ Message: "Category is required...!" })

        if (!isValidObjectId(authorId)) return res.status(400).send({ status: false, Message: `${authorId} -> Author Id should be valid` })
        if (!isValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })
        if (!isValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })
        if (!isValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })

        if (tags) {
            if (Array.isArray(tags)) {
                for (let i = 0; i < tags.length; i++) {
                    if (!isValid(tags[i])) return res.send({ status: false, Message: "Tags is invalid" })
                }
                data['tags'] = [...tags]
            } else {
                if (!isValid(tags)) return res.send({ status: false, Message: "Tags is invalid" })
                data['tags']=tags.trim()
            }
        }
        if (subcategory) {
            if (Array.isArray(subcategory)) {
                for (let i = 0; i < subcategory.length; i++) {
                    if (!isValid(subcategory[i])) return res.send({ status: false, Message: "Subacategory is invalid" })
                }
                data['subcategory'] = [...subcategory]
            } else {
                if (!isValid(subcategory)) return res.send({ status: false, Message: "Subcategory is invalid" })
                data['subcategory'] = subcategory.trim()
            }
        }

        const isAuthorExist = await authorModel.findById(authorId)
        if (!isAuthorExist) return res.status(400).send({ status: false, Message: "Author Does not exist" })

        if(req.authorId !== authorId) return res.send({status:false, Message:"AuthorId should be same as your AuthorId"})

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
        const blogs = { isDeleted: false, isPublished: true }
        if (isValidRequestBody(data)) {
            const { authorId, category, tags, subcategory } = data
            if (authorId) {
                if (isValid(authorId) && isValidObjectId(authorId))
                    blogs.authorId = authorId.trim()
            }
            if (category) {
                if (isValid(category))
                    blogs['category'] = category.trim()
            }
            if (tags) {
                if (isValid(tags)) {
                    const tagsArray = tags.trim().split(",").map(tags => tags.trim())
                    blogs.tags = { $all: tagsArray }
                }
            }
            if (subcategory) {
                if (isValid(subcategory)) {
                    const subcategoryArray = subcategory.trim().split(",").map(subcategory => subcategory.trim())
                    blogs.subcategory = { $all: subcategoryArray }
                }
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

        let { title, body, category, tags, subcategory, isPublished } = data

        let dataToBeUpdated = {
            $set: {},
            $addToSet: {}
        }

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to delete the blog" })

        if (title) {
            if (!isValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })
            dataToBeUpdated.$set['title'] = title
        }
        if (body) {
            if (!isValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })
            dataToBeUpdated.$set['body'] = body
        }

        if (category) {
            if (!isValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })
            dataToBeUpdated.$set['category'] = category
        }

        if (tags) {
            if (Array.isArray(tags)) {
                for (let i = 0; i < tags.length; i++) {
                    if (!isValid(tags[i])) return res.send({ status: false, Message: "Tags is invalid" })
                }
                dataToBeUpdated.$addToSet['tags'] = { $each: tags }
            } else {
                if (!isValid(tags)) return res.send({ status: false, Message: "Tags is invalid" })
                dataToBeUpdated.$addToSet['tags'] = tags.trim()
            }
        }
        if (subcategory) {
            if (Array.isArray(subcategory)) {
                for (let i = 0; i < subcategory.length; i++) {
                    if (!isValid(subcategory[i])) return res.send({ status: false, Message: "Subacategory is invalid" })
                }
                dataToBeUpdated.$addToSet['subcategory'] = { $each: subcategory }
            } else {
                if (!isValid(subcategory)) return res.send({ status: false, Message: "Subcategory is invalid" })
                dataToBeUpdated.$addToSet['subcategory'] = subcategory.trim()
            }
        }
        let updatedBlog = await blogModel.findByIdAndUpdate({ _id: blogId }, dataToBeUpdated, { new: true })

        isPublished ? updatedBlog.publishedAt = new Date() : updatedBlog.publishedAt = null
        updatedBlog.save()
        res.status(200).send({ status: true, message: "Blog update is successful", data: updatedBlog })
    }
    catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

//######################################################################################################################
let deleteBlogById = async (req, res) => {
    try {
        const blogId = req.params.blogId

        await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, Message: "Blog deleted successfully" })
    }
    catch (error) {
        res.status(500).send({ status: false, Message: "Error", error: error.message })
    }
}
//######################################################################################################################

const deleteBlogByQuery = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false }
        const queryParams = req.query

        if (!isValidRequestBody(queryParams)) return res.status(400).send({ status: false, Message: 'No query param received,aborting delete operation' })

        let { authorId, category, tags, subcategory, isPublished } = queryParams

        if (authorId)
            if (!isValid(authorId) && isValidObjectId(authorId)) filterQuery['authorId'] = authorId

        if (category)
            if (!isValid(category)) filterQuery['category'] = category

        if (isPublished)
            if (!isValid(isPublished)) filterQuery['isPublished'] = isPublished

        if (tags)
            if (!isValid(tags)) {
                const tagsArr = tags.trim().split('.').map(tag => tag.trim())
                filterQuery['tags'] = { $all: tagsArr }
            }
        if (subcategory)
            if (!isValid(subcategory)) {
                const subcategoryArray = subcategory.trim().split('.').map(subcat => subcat.trim())
                filterQuery['subcategory'] = { $all: subcategoryArray }
            }

        const blogs = await blogModel.find(filterQuery)

        if (blogs.length === 0) return res.status(404).send({ staus: false, Message: "No matching blogs found" })

        const idOfBlogsToDelete = blogs.map(blogs => { if (blogs.authorId.toString() === req.authorId) return blogs._id })
    
        if (idOfBlogsToDelete.length === 0) return res.status(404).send({ status: false, Message: "No blogs found" })
        console.log(idOfBlogsToDelete)

        await blogModel.updateMany({ _id: { $in: idOfBlogsToDelete } }, { $set: { isDeleted: true, deletedAt: Date.now() } })
        return res.status(200).send({ status: true, Message: "Blog(s) deleted successfully" })
    }
    catch (err) {
        res.status(500).send({ status: false, Message: "Error", error: err.message })
    }
}

//######################################################################################################################
module.exports = { createBlog, getblog, updateBlog, deleteBlogById, deleteBlogByQuery }
