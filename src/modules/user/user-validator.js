'use strict'

const { celebrate, Joi }        = require('celebrate'),
    constants                   = require('../../utils/constants'),
    mongoIdRegex                = /^[0-9a-fA-F]{24}$/;


const getUserConversations      = celebrate({
    query                       : Joi.object().keys({
        limit                   : Joi.number().integer().default(10),
        page_state              : Joi.string().optional(),
    })
})

const followServiceProvider     = celebrate({
    body                        : Joi.object().keys({
        serviceProviderId       : Joi.string().required().regex(mongoIdRegex)
    })
})

const unfollowServiceProvider   = celebrate({
    body                        : Joi.object().keys({
        serviceProviderId       : Joi.string().required().regex(mongoIdRegex)
    })
})

module.exports                  = {
    getUserConversations,
    followServiceProvider,
    unfollowServiceProvider
}