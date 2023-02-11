const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const formData = Schema({
    name: {
        type: String,
        required: true
    },
    sendFrom: {
        type: String,
        required: true
    },
    sendTo: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports = model('Form', formData);
