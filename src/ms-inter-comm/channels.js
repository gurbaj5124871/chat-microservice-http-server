'use strict'

const config            = require('../../app-config');
const getMsTopic        = msName => `microservice/${msName}`;

module.exports          = Object.freeze({
    // microservices topics
    ownTopic            : `${getMsTopic(config.get('/microServiceName'))}/*`,
    userServer          : `${getMsTopic('ironman')}`,

    // message publish channels
    hello               : `${getMsTopic(config.get('/microServiceName'))}/hello`,

    // message recieve channels
    spAdminVerified     : 'spAdminVerified'
})