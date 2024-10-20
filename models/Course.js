const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: String,
        required: [true, 'Please add number of weeks']
    },
    tuition: {
        type: Number,
        required: [true, 'Please add a tuition cost']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvailable: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
})

// Static method to get the avg of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {

    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageCost: { $avg: '$tuition' }
            }
        }
    ])

    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10
        })
    } catch (error) {
        console.error(error)
    }
}

// Call getAverageCost after save
CourseSchema.post('save', function () {
    this.constructor.getAverageCost(this.bootcamp);
})

// Call getAverageCost before remove
CourseSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    // const course = await this.model.findOne(this.getQuery());
    // The error occurs because you're using the pre('deleteOne') middleware with { document: true, 
    // query: false }. In this context, this refers to the document itself, not a query object. 
    // However, this.getQuery() is used with query middleware, not document middleware.
    // Since you're working with a document (because { document: true }), you can access the 
    // document's properties directly instead of calling this.getQuery(). Here's how you can modify 
    // the code to fix the issue:


    const course = this;  // 'this' refers to the document being deleted

    if (course) {
        await this.constructor.getAverageCost(course.bootcamp);
    }
    next();
});

module.exports = mongoose.model('Course', CourseSchema)