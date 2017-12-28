const functions = require('firebase-functions');

const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);


exports.users = functions.https.onRequest((request, response) => {
    if (hasAuthorization(request)) {
        if (request.method === "POST") {
            return createUser(request, response);
        } else if (request.method === "GET") {
            return getUsers(request, response);
        } else if (request.method === "PUT") {
            return updateUser(request, response)
        }
        return response.status(404).send();
    } else {
        response.status(401).send()
    }
});

function hasAuthorization(request) {
    const authorization = request.get('authorization');
    return (authorization != null && authorization.startsWith('Bearer '))
}

function createUser(request, response) {
    admin.auth().createUser(request.body)
        .then(user => response.send(user))
        .catch(error => response.status(400).send(error));
}

function getUsers(request, response) {
    const maxResults = request.body.maxResults;
    const pageToken = request.body.pageToken;
    admin.auth().listUsers(maxResults, pageToken)
        .then(users => {
            users.users = users.users.filter(user => user.providerData.length > 0);
            return response.send(users)
        }).catch(error => response.status(400).send(error));
}

function updateUser(request, response) {
    admin.auth().verifyIdToken(request.header.aut("Authorization"))
        .then(token => {
            admin.auth().updateUser(token.uid, request)
                .then(user => response.send(user))
        }).catch(error => response.status(400).send(error));
}


