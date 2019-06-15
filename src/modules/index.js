'use strict'

const chat              = require('./chat')
const user              = require('./user')


module.exports          = app => {
    app.use('/chat', chat)
    app.use('/user', user)
}