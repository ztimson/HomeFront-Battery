const axios = require('axios');
const fs = require('fs');
const firebase = require('firebase')

const config = {
	apiKey: "AIzaSyAs3FvBCADM66wR1-leBz6aIjK1wZfUxRo",
	authDomain: "homefront-2ccb4.firebaseapp.com",
	databaseURL: "https://homefront-2ccb4.firebaseio.com",
	projectId: "homefront-2ccb4",
	storageBucket: "homefront-2ccb4.appspot.com",
	messagingSenderId: "482384317544"
};

let text = fs.readFileSync('/sys/bus/w1/devices/28-0000062c1c39/w1_slave');
let temp = /t\=(\d{5})/g.exec(text);
let cel = Number(temp[1])/1000;

console.log(cel);

const settings = {/* your settings... */ timestampsInSnapshots: true};
firebase.initializeApp(config);

let firestore = firebase.firestore();
firestore.settings(settings)
firestore.collection('Battery').doc('TEMP').set({
	temp: cel,
	charging: false,
	percentage: '50%'
}).then(resp => process.exit()).catch(err => process.exit(1));
