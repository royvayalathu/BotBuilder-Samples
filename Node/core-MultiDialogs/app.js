// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen to messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var address = null;
var userSelection = null;
var request = null;
var response = null;

server.get('/api/event', function(req, res) {

    var newConversationAddress = Object.assign({}, address);
    delete newConversationAddress.conversation;
    request = req;
    response = res;

    bot.beginDialog(newConversationAddress, 'providerselection', null, (err) => {
        if (err) {
            // error ocurred while starting new conversation. Channel not supported?
            bot.send(new builder.Message()
                .text('This channel does not support this operation: ' + err.message)
                .address(address));
        }
    });
});

var bot = new builder.UniversalBot(connector, function (session) {
    address = session.message.address;
    // end current dialog
    session.endDialog('Thank you for adding us to your contact list!');
});

var ChoiceLabels = {
    Yes: 'Yes',
    No: 'No'
};

var SelectionLabels = {
    Provider1: 'Service Provider 1',
    Provider2: 'Service Provider 2',
    Provider3: 'Service Provider 3'
};


bot.dialog('providerselection', [
    function (session) {
        builder.Prompts.choice(
            session,
            'Water Sensor in your Garage has detected water leak in your Garage. Would you like us to send some one to have a look?',
            [ChoiceLabels.Yes, ChoiceLabels.No],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
    },
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case ChoiceLabels.Yes:
                session.userData.userChoice = 'yes';
            case ChoiceLabels.No:
                session.userData.userChoice = 'no';
        }
        session.send('Welcome to Enab.le Service Provider Selection!');
        builder.Prompts.choice(
            session,
            'Please select your preferred Provider nearest to you',
            [SelectionLabels.Provider1, SelectionLabels.Provider2, SelectionLabels.Provider3],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
     },
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        var selection = result.response.entity;
        switch (selection) {
            case SelectionLabels.Provider1:
                session.userData.preferredProvider = 'provider1';
            case SelectionLabels.Provider2:
                session.userData.preferredProvider = 'provider2';
            case SelectionLabels.Provider3:
                session.userData.preferredProvider = 'provider3';
        }
        session.endDialog('We will soon notify the service provider to assist you ASAP %s', result.response);

        response.json({requestedSupport: session.userData.userChoice,preferredProvider : session.userData.preferredProvider});
   }
]);

/*var bot = new builder.UniversalBot(connector, [
    function (session) {
        // prompt for search option
        builder.Prompts.choice(
            session,
            'Water Sensor in your Garage has detected water leak in your Garage. Would you like us to send some one to have a look?',
            [DialogLabels.Yes, DialogLabels.No],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
    },
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.Yes:
                return session.beginDialog('hotels');
            case DialogLabels.No:
                return session.beginDialog('flights');
        }
    }
]);

bot.dialog('flights', require('./flights'));
bot.dialog('hotels', require('./hotels'));
bot.dialog('support', require('./support'))
    .triggerAction({
        matches: [/help/i, /support/i, /problem/i]
    });

// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

*/
