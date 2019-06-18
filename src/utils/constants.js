module.exports          = Object.freeze({
    userRoles           : {
        customer        : 'customer',
        serviceProvider : 'serviceProvider',
        admin           : 'admin'
    },
    accessRoles         : {
        admin           : {
            admin       : 'admin',
            superAdmin  : 'superAdmin'
        },
        customer        : {
            customer    : 'customer',
            influencer  : 'influencer'
        },
        serviceProvider : {
            serviceProvider: 'serviceProvider'
        }
    },
    platforms           : {
        android         : 'android',
        ios             : 'ios',
        web             : 'web',
        mobileWeb       : 'mobileWeb'
    },
    resource            : {
        admin           : 'admin',
        customer        : 'customer',
        serviceProvider : 'serviceProvider',
        businessTypes   : 'businessTypes',
        businessSubTypes: 'businessSubTypes',
        allServiceProviders: 'allServiceProviders',
        allCustomers    : 'allCustomers',
        follow          : 'follow',
        getFollowersList: 'getFollowersList',
        conversations   : 'conversations',
        groupChat       : 'groupChat',
    },
    
    conversationTypes   : {
        single          : 'single',
        channel         : 'channel',
        group           : 'group',
        campaign        : 'campaign'
    },
    messageType         : {
        text            : 'text',
        notificaiton    : 'notificaiton'
    },

    // default messages
    defalutMessages     : {
        spAdminVerified : name => `This is the beginning of the journey of ${name}`
    }
})