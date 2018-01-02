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
    if (authorization.startsWith('Bearer ')) {
        const token = authorization.split('Bearer ')[1];
        return admin.auth().verifyIdToken(token)
            .then(() => true)
            .catch(() => false)
    }
    return false;
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
            return response.send(users.users)
        }).catch(error => response.status(400).send(error));
}

function updateUser(request, response) {
    const token = request.get('authorization').split('Bearer ')[1];
    admin.auth().updateUser(token, request)
        .then(user => response.send(user))
}


