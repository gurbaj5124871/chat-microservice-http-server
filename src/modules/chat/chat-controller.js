'use strict'

const chatServices              = require('./chat-services'),
    userServices                = require('../user/user-services'),
    constants                   = require('../../utils/constants'),
    errify                      = require('../../utils/errify'),
    errMsg                      = require('../../utils/error-messages');

const getSingleConversation     = async (req, res, next) => {
    try {
        const {other_user_id: otherUserId} = req.query;
        if (otherUserId === req.user.userId)
            return next(errify.unauthorized(errMsg['2000'], 2000));
        const conversationResult= await chatServices.getConversationBetweenTwoUsers(req.user.userId, otherUserId)
        const conversation      = conversationResult.rowLength ? conversationResult.rows[0]: await chatServices.createConversationBetweenTwoUsers(req.user, otherUserId);
        if(conversationResult.rowLength) {
            const conversationBlockStatus = await chatServices.getConversationsBlockStatus(conversationResult.rows)
            conversation.is_other_user_blocked = conversationBlockStatus.get(conversation.conversation_id.toString())
        }
        return res.send(conversation)
    } catch (err) {
        next(err)
    }
}

const getConversationById       = async (req, res, next) => {
    try {
        const conversationId    = req.params.conversationId, userId = req.user.userId;
        const conversationResult= await chatServices.getConversationById(conversationId, userId)
        if(conversationResult.rowLength === 0)
            return next(errify.notFound(errMsg['2002'], 2002))
        const conversation      = conversationResult.rows[0]
        const blockStatus       = await chatServices.getConversationsBlockStatus(conversationResult.rows)
        conversation.is_other_user_blocked = blockStatus.get(conversationId)
        return res.send(conversation)
    } catch (err) {
        next(err)
    }
}

const getMessages               = async (req, res, next) => {
    try {
        const conversationId    = req.params.conversationId;
        const {fetch_size: fetchSize, page_state: pageState, last_message_id: lastMessageId} = req.query;
        if(!pageState)          {
            const conversationResult= await chatServices.getConversationById(conversationId, req.user.userId)
            if(conversationResult.rowLength === 0)
                return next(errify.notFound(errMsg['2002'], 2002))
        }
        const messages          = await chatServices.getMessages(conversationId, fetchSize, pageState, lastMessageId)
        if(messages.rowLength)  {
            const {customers, serviceProviders, messageIds} = messages.rows.reduce((result, mess) => {
                result.messageIds.push(mess.message_id)
                if(mess.sender_type === constants.userRoles.customer)
                    result.customers.add(mess.sender_id)
                else if(mess.sender_type === constants.userRoles.serviceProvider)
                    result.serviceProviders.add(mess.sender_id)
                return result
            }, {customers: new Set(), serviceProviders: new Set(), messageIds: []})
            const customerDetails= customers.size ? await userServices.getCustomersBasicDetailsByIds([...customers]) : new Map()
            const serviceProviderDetails = serviceProviders.size ? await userServices.getServiceProvidersBasicDetailsByIds([...serviceProviders]) : new Map()
            const acknowlegements= await chatServices.getMessagesAcknowlegements(conversationId, messageIds)
            for(let i=messages.rowLength-1; i>=0; i-=1) {
                const message   = messages.rows[i]
                const messageAck= acknowlegements.get(message.message_id.toString()) 
                const sender    = message.message_type === constants.userRoles.customer ? customerDetails.get(message.sender_id) : serviceProviderDetails.get(message.sender_id)
                message.delivered_count     = messageAck ? messageAck.delivered_count : 0
                message.seen_count          = messageAck ? messageAck.seen_count : 0
                message.sender_name         = sender.name
                message.sender_image_url    = sender.imageUrl
                message.sender_first_name   = sender.firstName
                message.sender_last_name    = sender.lastName
            }
            if(!pageState) 
                await chatServices.clearUnreadCount(conversationId, req.user.userId)
        }
        const next          = messages.rowLength < fetchSize ? 'false' : `?fetch_size=${fetchSize}&page_state=${messages.pageState}`
        return res.send({messages: messages.rows, next})
    } catch (err) {
        next(err)
    }
}

const blockConversation         = async (req, res, next) => {
    try {
        const conversationId    = req.params.conversationId
        await chatServices.changeBlockStatusByConversationId(conversationId, req.user.userId, true)
        return res.send({sucess: true})
    } catch (err) {
        next(err)
    }
}

const unblockConversation       = async (req, res, next) => {
    try {
        const conversationId    = req.params.conversationId
        await chatServices.changeBlockStatusByConversationId(conversationId, req.user.userId, false)
        return res.send({sucess: true})
    } catch (err) {
        next(err)
    }
}

const clearUnreadCount          = async (req, res, next) => {
    try {
        const conversationId    = req.params.conversationId, userId = req.user.userId;
        await chatServices.clearUnreadCount(conversationId, userId)
        return res.send({sucess: true})
    } catch (err) {
        next(err)
    }
}

module.exports                  = {
    getSingleConversation,
    getConversationById,
    getMessages,
    blockConversation,
    unblockConversation,
    clearUnreadCount
}