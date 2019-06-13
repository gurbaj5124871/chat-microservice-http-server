'use strict'

const { celebrate, Joi }        = require('celebrate'),
    constants                   = require('../../utils/constants'),
    mongoIdRegex                = /^[0-9a-fA-F]{24}$/;

const getSingleConversation     = celebrate({
    query                       : Joi.object().keys({
        other_user_id           : Joi.string().required().regex(mongoIdRegex)
    })
})


module.exports                  = {
    getSingleConversation
}