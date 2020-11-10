const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://ADMIN:MONGODB13A@cluster0.brddm.mongodb.net/buglogger-tp?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        })

        console.log('MongoDB connected')

    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

module.exports = connectDB