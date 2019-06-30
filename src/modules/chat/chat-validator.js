'use strict'

const { celebrate, Joi }        = require('celebrate'),
    constants                   = require('../../utils/constants'),
    mongoIdRegex                = /^[0-9a-fA-F]{24}$/,
    timeUuidRegex               = /(\w{8}(-\w{4}){3}-\w{12}?)/;

const getSingleConversation     = celebrate({
    query                       : Joi.object().keys({
        other_user_id           : Joi.string().required().regex(mongoIdRegex)
    })
})

const getConversationById       = celebrate({
    params                      : Joi.object().keys({
        conversationId          : Joi.string().required().regex(timeUuidRegex)
    })
})

const getMessages               = celebrate({
    params                      : Joi.object().keys({
        conversationId          : Joi.string().required().regex(timeUuidRegex)
    }),
    query                       : Joi.object().keys({
        fetch_size              : Joi.number().integer().min(1).max(100).default(20),
        page_state              : Joi.string(),
        last_message_id         : Joi.string().regex(timeUuidRegex)
    })
})

module.exports                  = {
    getSingleConversation,
    getConversationById,
    getMessages
}