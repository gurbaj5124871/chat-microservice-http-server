'use strict'

const userServices              = require('./user-services'),
    chatServices                = require('../chat/chat-services'),
    errify                      = require('../../utils/errify'),
    errMsg                      = require('../../utils/error-messages');

const getUserConversations      = async (req, res, next) => {
    try {
        const userId            = req.user.userId, {page_state: pageState, limit} = req.query;
        const conversationResult= await userServices.getUserConversations(userId, limit, pageState)
        const conversations     = conversationResult.rows
        if(conversationResult.rowLength) {
            const unreadCount   = await chatServices.getUnreadCounts(userId, conversations.map(convo => convo.conversation_id))
            const isUserBlocked = await chatServices.getConversationsBlockStatus(conversations)
            const otherUserDetails = await userServices.getUsersBasicDetailsFromConversations(conversations)
            for(let i=0; i<conversationResult.rowLength; i+=1) {
                let conversation                = conversations[i]
                conversation.unread_count       = unreadCount[i]
                conversation.other_user_blocked = isUserBlocked.get(conversation.conversation_id.toString()) || null
                if(conversation.other_user_id)  {
                    const {name: other_user_name, imageUrl: other_user_image_url} = otherUserDetails.get(conversation.conversation_id.toString())
                    conversation    = Object.assign(conversation, {other_user_name, other_user_image_url})
                } else conversation    = Object.assign(conversation, {other_user_name: null, other_user_image_url: null})
            }
        }
        return res.send(userServices.paginateConversations(conversations, limit, conversationResult.pageState))
    } catch (err) {
        next(err)
    }
}

const getUserConversationsCached= async (req, res, next) => {
    try {
        const userId            = req.user.userId, {last_score: lastScore, limit} = req.query;
        const conversations     = await userServices.getUserConversationsCached(userId, limit, lastScore)
        const convosFetchedCount= conversations.length;
        if(convosFetchedCount) {
            const unreadCount   = await chatServices.getUnreadCounts(userId, conversations.map(convo => convo.conversation_id))
            const isUserBlocked = await chatServices.getConversationsBlockStatus(conversations)
            const otherUserDetails = await userServices.getUsersBasicDetailsFromConversations(conversations)
            for(let i=0; i<convosFetchedCount; i+=1) {
                let conversation                = conversations[i]
                conversation.unread_count       = unreadCount[i]
                conversation.other_user_blocked = isUserBlocked.get(conversation.conversation_id.toString()) || null
                if(conversation.other_user_id)  {
                    const {name: other_user_name, imageUrl: other_user_image_url} = otherUserDetails.get(conversation.conversation_id.toString())
                    conversation    = Object.assign(conversation, {other_user_name, other_user_image_url})
                } else conversation    = Object.assign(conversation, {other_user_name: null, other_user_image_url: null})
            }
        }
        return res.send(userServices.paginateConversationsCached(conversations, limit, conversations[convosFetchedCount -1].last_message_unix_time))
    } catch (err) {
        next(err)
    }
}

const followServiceProvider     = async (req, res, next) => {
    try {
        const customerId        = req.user.userId, serviceProviderId = req.body.serviceProviderId;
        const serviceProvider   = (await userServices.getServiceProvidersBasicDetailsWithoutCache([serviceProviderId])).get(serviceProviderId)
        if(serviceProvider === undefined)
            throw errify.badRequest(errMsg['1017'], 1017)
        const followHistory     = await userServices.getCustomerServiceProviderFollowHistory(customerId, serviceProviderId)
        if(followHistory.follow === true)
            throw errify.badRequest(errMsg['2001'], 2001)
        const {mqttTopics}      = await userServices.followServiceProvider(customerId, serviceProviderId, followHistory)
        res.send({mqttTopics})
        // send push notification to sp regarding following
        
    } catch (err) {
        next(err)
    }
}

const unfollowServiceProvider   = async (req, res, next) => {
    try {
        const customerId        = req.user.userId, serviceProviderId = req.body.serviceProviderId;
        const {mqttTopics}      = await userServices.unfollowServiceProvider(customerId, serviceProviderId)
        return res.send({mqttTopics})
    } catch (err) {
        next(err)
    }
}

module.exports          = {
    getUserConversations,
    getUserConversationsCached,
    followServiceProvider,
    unfollowServiceProvider
}