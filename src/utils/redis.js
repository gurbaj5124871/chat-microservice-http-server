const redis                 = require('../../bootstrap/redis').redisClient;

const redisKeys             = Object.freeze({

    // Sorted Set storing verified business types [score, value]
    businessTypes           : `businessTypes:`,

    // Hash map storing customers sessions [ NEVER EXPIRE ON PROD] {key : {sessionId: session}}
    customerSession         : customerId => `customerSession:${customerId}`,

    // Hash map storing service provider sessions [ NEVER EXPIRE ON PROD] {key : {sessionId: session}}
    serviceProviderSession  : serviceProviderId => `serviceProviderSession:${serviceProviderId}`,

    // Hash map storing admins sessions {key : {sessionId: session}}
    adminSession            : adminId => `adminSession:${adminId}`,

    // key value which should have expiration
    customerPhoneVerification: phoneNumber => `customerPhoneVerification:${phoneNumber}`,
    
    // user basic details, expire it after one month or update on user update
    user                    : userId => `user:${userId}`,

    // key value storing service provider default channel id
    spDefaultChannel        : serviceProviderId => `spDefaultChannel:${serviceProviderId}`
})

module.exports              = {
    redis,
    redisKeys
}