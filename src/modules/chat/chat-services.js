const cassandra                 = require('../../../bootstrap/cassandra').client,
    cassandraDriver             = require('cassandra-driver'),
    {monogdb, collections}      = require('../../utils/mongo'),
    constants                   = require('../../utils/constants'),
    logger                      = require('../../utils/logger'),
    errify                      = require('../../utils/errify'),
    errMsg                      = require('../../utils/error-messages');

const createDefaultChannelForSP = async (serviceProviderId, serviceProvider) => {
    try {
        const channelExistsQuery= `SELECT conversation_id FROM conversations_by_time WHERE user_id = ? AND conversation_type = ?`
        const channelExistsCheck= await cassandra.execute(channelExistsQuery, [serviceProviderId, constants.conversationTypes.channel], {prepare: true, fetchSize: 1})
        if(channelExistsCheck.rowLength === 0) {
            const conversationId= cassandraDriver.types.TimeUuid.now()
            const spDefaultChannel = `
                INSERT INTO conversations (conversation_id, user_id, conversation_type, conversation_user_type,
                last_message_id, last_message_content, last_message_sender_id, last_message_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            const params        = [
                conversationId, serviceProviderId, constants.conversationTypes.channel, constants.userRoles.serviceProvider,
                conversationId, constants.defalutMessages.spAdminVerified(serviceProvider.name), serviceProviderId, constants.messageType.notificaiton
            ]
            await cassandra.execute(spDefaultChannel, params, {prepare: true})
        }
    } catch (err) {
        console.log(err)
       // logger.error({message: err})
    }
}

const getConversationBetweenTwoUsers= (userId, otherUserId) => {
    const query     = `SELECT * FROM conversation_by_pairs WHERE user_id = ? AND other_user_id = ?`;
    const params    = [userId, otherUserId];
    return cassandra.execute(query, params, {prepare: true});
}

const createConversationBetweenTwoUsers = async (requestedUser, otherUserId) => {
    const userId    = requestedUser.userId, userType = requestedUser.role;
    const otherUserType = userType === constants.userRoles.customer ? constants.userRoles.serviceProvider : constants.userRoles.customer;
    const collection= otherUserType === constants.userRoles.customer ? collections.customers : collections.serviceproviders;
    const otherUser = await monogdb.collection(collection).findOne({_id: otherUserId}, {_id: 1});
    if(!otherUser)
        throw errify.notFound(errMsg['1017'], 1017)
    const conversationId    = cassandraDriver.types.TimeUuid.now(), conversationType = constants.conversationTypes.single;
    const query     = `INSERT INTO conversations (conversation_id, user_id, other_user_id, conversation_type, conversation_user_type) VALUES (?, ?, ?, ?, ?)`;
    const queries   = [
        {query, params: [conversationId, userId, otherUserId, conversationType, userType]},
        {query, params: [conversationId, userId, otherUserId, conversationType, otherUserType]}
    ]
    await cassandra.batch(queries, {prepare: true});
    return {
        conversation_id: conversationId, user_id: userId, other_user_id: otherUserId, conversation_type: conversationType,
        conversation_user_type: userType, is_blocked: false, is_other_user_blocked: false,
        last_message_id: null, last_message_content: null, last_message_sender_id: null, last_message_type: null
    }
}

const getConversationsBlockStatus   = async conversations => {
    const query     = `SELECT conversation_id, is_blocked from conversations WHERE conversation_id = ? AND user_id = ?`;
    const requests  = conversations.reduce((req, conversation) => {
        if(conversation.other_user_id) 
            req.push(cassandra.execute(query, [conversation.conversation_id, conversation.other_user_id], {prepare: true}));
        return req
    }, []);
    const results   = requests.length ? await Promise.all(requests) : []
    const conversationBlocked = new Map();
    results.forEach(result => conversationBlocked.set(result.rows[0].conversation_id.toString(), result.rows[0].blocked));
    return conversationBlocked;
}

const getUnreadCount            = async (userId, conversationId) => {
    const query     = `SELECT conversation_id, unread FROM unread_count WHERE conversation_id = ? AND user_id = ?`;
    const count     = await cassandra.execute(query, [conversationId, userId], {prepare: true});
    return count.rowLength ? parseInt(count.rows[0].unread) : 0;
}

const getUnreadCounts           = (userId, conversationIds) => Promise.all(conversationIds.map(id => getUnreadCount(userId, id)))

module.exports                  = {
    createDefaultChannelForSP,
    getConversationBetweenTwoUsers,
    createConversationBetweenTwoUsers,
    getConversationsBlockStatus,
    getUnreadCount,
    getUnreadCounts
}