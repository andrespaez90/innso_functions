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


exports.addBillTrigger = functions.database
    .ref("bills/{year}/{month}")
    .onWrite(event => {

        let revenue = 0;
        let taxes = 0;
        const bills = event.data.val();
        console.log('addBillTrigger', bills);

        if(bills != null){;
            Object.keys(bills).map(function (key, index) {
                const bill = bills[key];
                revenue += bill.total;
                taxes += bill.taxes;
            });
        }

        let year = event.params.year;
        let month = event.params.month
        let dbRef = admin.database().ref(`finance/${year}/summary/${month}`);
        dbRef.child('revenue').set(revenue);
        dbRef.child('taxes').set(taxes);

        return false
    });


exports.onRevenueMonthChange = functions.database
    .ref("finance/{year}/summary")
    .onWrite( event => {

        let totalRevenue = 0;
        const summaries = event.data.val();
        console.log('onValuesMonthChange', summaries);
        if(summaries != null){
            Object.keys(summaries).map(function (key, index) {
                totalRevenue += summaries[key].revenue;
            });
        }
        return event.data.ref.parent.child('total_revenue').set(totalRevenue);
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


