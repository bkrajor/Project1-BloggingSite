const { default: mongoose } = require("mongoose")
const authorModel = require("../models/authorModel")
const blogModel = require("../models/blogModel")

//######################################################################################################################
let isValid = function (value) {
    if (typeof (value) == "undefined" || typeof (value) == null) return false
    if (typeof (value) === "string" && value.trim().length == 0) return false
    return true
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

        let { authorId, title, body, category, tags, subcategory, isPublished } = data

        if (!authorId) return res.status(400).send({ Message: "authorId is required...!" })
        if (!title) return res.status(400).send({ Message: "Title is required...!" })
        if (!body) return res.status(400).send({ Message: "Body is required...!" })
        if (!category) return res.status(400).send({ Message: "Category is required...!" })

        if (!validObjectId(authorId)) return res.status(400).send({ status: false, Message: `${authorId} -> Author Id should be valid` })
        if (!isValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })
        if (!isValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })
        if (!isValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })

        if (tags) {
            if (Array.isArray(tags))
                data['tags'] = [...tags]
            if (Object.prototype.toString.call(tags) === "[object String]")
                data['tags'] = [tags]
        }
        if (subcategory) {
            if (Array.isArray(subcategory))
                data['subcategory'] = [...subcategory]
            if (Object.prototype.toString.call(subcategory) === "[object String]")
                data['subcategory'] = [...subcategory]
        }

        const validAuthorId = await authorModel.findById(authorId)
        if (!validAuthorId) return res.status(400).send({ status: false, Message: "Author Does not exist" })

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
        if (validRequestBody(data)) {
            const { authorId, category, tags, subcategory } = data
            if (authorId) {
                if (!validObjectId(authorId)) return res.send({ status: false, Message: "AuthorId is invalid" })
                let isAuthorExist = await authorModel.findById(authorId)
                if (!isAuthorExist) return res.send({ status: false, Message: "Author does not exist" })
                blogs.authorId = authorId
            }
            if (category) {
                if (!isValid(category)) return res.send({ status: false, Message: "Category is invalid" })
                blogs.category = category.trim()
            }
            if (tags) {
                if (Array.isArray(tags)) {
                    for (let i = 0; i < tags.length; i++) {
                        if (!isValid(tags[i]))
                            return res.send({ status: false, Message: "Tags is invalid" })
                        blogs['tags'] = tags[i].trim()
                    }
                }
            } else {
                if (!isValid(tags)) return res.send({ status: false, Message: "Tags is invalid" })
                blogs['tags'] = tags.trim()
            }
            if (subcategory) {
                if (Array.isArray(subcategory)) {
                    for (let i = 0; i < subcategory.length; i++) {
                        if (!isValid(subcategory[i]))
                            return res.send({ status: false, Message: "Subacategory is invalid" })
                        blogs['subcategory'] = subcategory[i].trim()
                    }
                }
            } else {
                if (!isValid(subcategory)) return res.send({ status: false, Message: "Subcategory is invalid" })
                blogs['subcategory'] = subcategory.trim()
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

        if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to delete the blog" })

        if (data.hasOwnProperty(title)) {
            if (!isValid(title)) return res.status(400).send({ status: false, Message: "title should be valid" })
            dataToBeUpdated.$set['title'] = title.trim()
        }
        if (data.hasOwnProperty(body)) {
            if (!isValid(body)) return res.status(400).send({ status: false, Message: "body should be valid" })
            dataToBeUpdated.$set['body'] = body.trim()
        }

        if (data.hasOwnProperty(category)) {
            if (isValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })
            dataToBeUpdated.$set['category'] = category.trim()
        }

        if (data.hasOwnProperty(tags)) {
            if (Array.isArray(tags)) {
                for (let i = 0; i < tags.length; i++) {
                    if (!isValid(tags[i])) return res.send({ status: false, Message: "Tags is invalid" })
                }
                dataToBeUpdated.$addToSet['tags'] = { $each: tags }
            }
        } else {
            if (!isValid(tags)) return res.send({ status: false, Message: "Tags is invalid" })
            dataToBeUpdated.$addToSet['tags'] = tags.trim()
        }
        if (data.hasOwnProperty(subcategory)) {
            if (Array.isArray(subcategory)) {
                for (let i = 0; i < subcategory.length; i++) {
                    if (!isValid(subcategory[i])) return res.send({ status: false, Message: "Subacategory is invalid" })
                }
                dataToBeUpdated.$addToSet['subcategory'] = { $each: subcategory }
            }
        } else {
            if (!isValid(subcategory)) return res.send({ status: false, Message: "Subcategory is invalid" })
            dataToBeUpdated.$addToSet['subcategory'] = subcategory.trim()

            let updatedBlog = await blogModel.findByIdAndUpdate({ _id: blogId }, dataToBeUpdated, { new: true })

            isPublished ? updatedBlog.publishedAt = new Date() : updatedBlog.publishedAt = null
            updatedBlog.save()
            res.status(200).send({ status: true, message: "Blog update is successful", data: updatedBlog })
        }
    } catch (err) {
        res.status(500).send({ Error: err.message })
    }
}

//######################################################################################################################
let deleteBlog = async (req, res) => {
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
// const deleteBlogs = async function (req, res) {
//     try {
//         let data = req.query
//         let blogId = req.params.blogId

//         let { authorId, category, tags, subcategory, isPublished } = data

//         let dataToBedeleted = {}

//         if (!validRequestBody(data)) return res.status(400).send({ status: false, Message: "Please provide something to delete the blogs" })
//         if (!validObjectId(blogId)) return res.status(400).send({ status: false, Message: "BlogId is not valid" })

//         if (data.hasOwnProperty(authorId)) {
//             if (!validObjectId(authorId)) return res.status(400).send({ status: false, Message: "AuthorId should be valid" })
//             dataToBedeleted['authorId'] = authorId.trim()
//         }
       
//         if (data.hasOwnProperty(category)) {
//             if (isValid(category)) return res.status(400).send({ status: false, Message: "category should be valid" })
//             dataToBedeleted['category'] = category.trim()
//         }

//         if (data.hasOwnProperty(tags)) {
//             if (Array.isArray(tags)) {
//                 for (let i = 0; i < tags.length; i++) {
//                     if (!isValid(tags[i])) return res.send({ status: false, Message: "Tags is invalid" })
//                 }
//                 dataToBedeleted['tags'] = { $each: tags }
//             }
//         } else {
//             if (!isValid(tags)) return res.send({ status: false, Message: "Tags is invalid" })
//             dataToBedeleted['tags'] = tags.trim()
//         }
//         if (data.hasOwnProperty(subcategory)) {
//             if (Array.isArray(subcategory)) {
//                 for (let i = 0; i < subcategory.length; i++) {
//                     if (!isValid(subcategory[i])) return res.send({ status: false, Message: "Subacategory is invalid" })
//                 }
//                 dataToBedeleted['subcategory'] = { $each: subcategory }
//             }
//         } else {
//             if (!isValid(subcategory)) return res.send({ status: false, Message: "Subcategory is invalid" })
//             dataToBedeleted['subcategory'] = subcategory.trim()

//             let deletedBlog = await blogModel.findByIdAndUpdate({ _id: blogId }, dataToBedeleted, { new: true })

//             isPublished ? deletedBlog.publishedAt = new Date() : deletedBlog.publishedAt = null
//             deletedBlog.save()
//             res.status(200).send({ status: true, message: "Blog update is successful", data: deletedBlog })
//         }
//     } catch (err) {
//         res.status(500).send({ Error: err.message })
//     }
// }

//######################################################################################################################
module.exports = { createBlog, getblog, updateBlog, deleteBlog }
