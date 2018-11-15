const axios = require('axios');
const fs = require('fs');
const firebase = require('firebase');

const namespace = 'TEMP';
const name = 'RaspberryPi';

(async () => {
	// Get temerature from sensor
	let text = fs.readFileSync('/sys/bus/w1/devices/28-0000062c1c39/w1_slave');
	let temp = /t\=(\d{5})/g.exec(text);
	let cel = Number(temp[1])/1000;
	console.log('temperture: ', cel);

	// Send data to firebase
	firebase.initializeApp({
		apiKey: "AIzaSyAs3FvBCADM66wR1-leBz6aIjK1wZfUxRo",
		authDomain: "homefront-2ccb4.firebaseapp.com",
		databaseURL: "https://homefront-2ccb4.firebaseio.com",
		projectId: "homefront-2ccb4",
		storageBucket: "homefront-2ccb4.appspot.com",
		messagingSenderId: "482384317544"
	});
	let firestore = firebase.firestore();
	firestore.settings({timestampsInSnapshots: true})
	let data = (await firestore.collection('Battery').doc(namespace).get()).data();
	if(!data[name]) data[name] = [];
	data[name].push({
		temp: cel,
		charging: false,
		percentage: 0.5
	});
	data.splice(0, data.length - 1440);

	try {
		await firestore.collection('Battery').doc(namespace).update(data)
		process.exit();
	} catch(err) {
		process.exit(1);
	}
})();
