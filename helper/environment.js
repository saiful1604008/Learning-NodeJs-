const environments = {};

environments.staging = {
    port: 3002,
    envName: 'staging',
    secretKey: 'SSDTECH',
    twilio: {
        fromPhone: '+16175551212',
        accountSid: 'AC99a71147a691cfee3f20576bff9da770',
        authToken: '98c0a93be47fed6e4202922fd4acfa42',
    },
};

environments.production = {
    port: 4000,
    envName: 'production',
    secretKey: 'Dotlines',
    twilio: {
        fromPhone: '+16175551212',
        accountSid: 'AC99a71147a691cfee3f20576bff9da770',
        authToken: '98c0a93be47fed6e4202922fd4acfa42',
    },
};

const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;



module.exports = environmentToExport;