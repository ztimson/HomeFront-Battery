#include <OneWire.h> 
#include <DallasTemperature.h>

OneWire oneWire0(12);
OneWire oneWire1(10);
OneWire oneWire2(8);
OneWire oneWire3(6);

DallasTemperature sensor0(&oneWire0);
DallasTemperature sensor1(&oneWire1);
DallasTemperature sensor2(&oneWire2);
DallasTemperature sensor3(&oneWire3);

int relayOn = 0;

void setup(void) {
  Serial.begin(9600);
  
  pinMode(A0, INPUT);
  pinMode(A1, INPUT);
  pinMode(A2, INPUT);
  pinMode(A3, INPUT);
  
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  
  sensor0.begin();
  sensor1.begin();
  sensor2.begin();
  sensor3.begin();
}

void loop(void) {
  // Activate relay
  if(Serial.available() > 0) {
    char incoming = Serial.read();
    if(incoming == '5') {
      digitalWrite(13, LOW);
    } else if(incoming == '6') {
      digitalWrite(13, HIGH);
    }
  }
  
  // Voltage data: Input * 4.521 / 1023.0 / 5 * VoltDiv
  float vin0 = analogRead(A0) * 0.0493995;
  float vin1 = analogRead(A1) * 0.0522986;
  float vin2 = analogRead(A2) * 0.0488798;
  float vin3 = analogRead(A3) * 0.0500341;
  vin0 = vin0 - vin1;
  vin2 = vin2 - vin3;
  
  // Temp data
  sensor0.requestTemperatures();
  float temp0 = sensor0.getTempCByIndex(0);
  sensor1.requestTemperatures();
  float temp1 = sensor1.getTempCByIndex(0);
  sensor2.requestTemperatures();
  float temp2 = sensor2.getTempCByIndex(0);
  sensor3.requestTemperatures();
  float temp3 = sensor3.getTempCByIndex(0);
  
  // Output data
  Serial.println(String(vin0) + " " + String(temp0) + " " + String(vin1) + " " + String(temp1) + " " + String(vin2) + " " + String(temp2) + " " + String(vin3) + " " + String(temp3));
}
