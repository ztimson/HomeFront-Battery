# HomeFront-Battery

After obtaining 4 Tesla battery modules from a model X, a client and I decided to build our own knock off Tesla power wall and hook it up to a solar array to create an offgrid system. Part of this project was to log the voltage, battery tempature and control a set of fans through a website so it could be controleld and monitored remotely.

We accomplished the software side in 3 steps:
 - An arduino to log the raw data from sensors and transmit them over the serial port (See the arduino.ini file)
 - A raspberry pi to recieve the serial data and send it to the cloud DB (See the monitor.js file)
 - [A website to display the recorded data live](https://github.com/ztimson/HomeFront)

![Power Wall](https://github.com/ztimson/HomeFront-Battery/blob/master/pictures/Resized_20181124_121520_5410.jpg?raw=true)
