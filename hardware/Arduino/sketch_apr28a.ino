#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <HTTPClient.h>

// Object Declarations
Adafruit_MPU6050 mpu;
MAX30105 particleSensor;

// WiFi Credentials
char ssid[] = "Afreen_Riyaz";
char pass[] = "Afreen789";

// LED GPIOs
const int wifiConnectedLED = 2;
const int wifiNotConnectedLED = 4;

// LM35 Analog Pin
const int LM35_PIN = 34;

// Motion Detection
const float movementThreshold = 0.5;
unsigned long lastMotionTime = 0;
const unsigned long noMotionThreshold = 300000; // 5 minutes
String positionStatus;

// Heart Rate Variables
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;
float lastBPM = 0;
int lastAvgBPM = 0;
float lastSpO2 = 0;
float lastTemp = 0;
String lastPosition = "";
bool lastFingerPresent = false;

// Supabase config
const char* SUPABASE_URL = "https://porabnsxqjdgmnxwqzms.supabase.co/rest/v1";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcmFibnN4cWpkZ21ueHdxem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0ODM1MTMsImV4cCI6MjA2ODA1OTUxM30.08Z5UqEfSnL0-2U5kisTvZDsBEv5jATeKtBZnDu1Fvw";

// Timers
unsigned long lastLiveUpdate = 0;
unsigned long lastHistoryUpdate = 0;
const unsigned long LIVE_UPDATE_INTERVAL = 5000; // 5 seconds
const unsigned long HISTORY_UPDATE_INTERVAL = 300000; // 5 minutes

void sendLiveData(float heart_rate, float spo2, float temperature, String position) {
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/live_data?id=eq.1";
  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=representation");
  String positionToSend = position.length() > 0 ? position : "Unknown";
  String payload = "{";
  payload += "\"heart_rate\":" + String(heart_rate, 1) + ",";
  payload += "\"spo2\":" + String(spo2, 1) + ",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"position\":\"" + positionToSend + "\"";
  payload += "}";
  Serial.print("PATCH Payload: ");
  Serial.println(payload);
  int httpResponseCode = http.PATCH(payload);
  Serial.print("[Supabase PATCH live_data] HTTP Response code: ");
  Serial.println(httpResponseCode);
  http.end();
}

void sendHistoricalData(float heart_rate, float spo2, float temperature, String position) {
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/historical_data";
  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Content-Type", "application/json");
  String positionToSend = position.length() > 0 ? position : "Unknown";
  String payload = "{";
  payload += "\"heart_rate\":" + String(heart_rate, 1) + ",";
  payload += "\"spo2\":" + String(spo2, 1) + ",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"position\":\"" + positionToSend + "\"";
  payload += "}";
  Serial.print("POST Payload: ");
  Serial.println(payload);
  int httpResponseCode = http.POST(payload);
  Serial.print("[Supabase POST historical_data] HTTP Response code: ");
  Serial.println(httpResponseCode);
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("Initializing...");

  WiFi.begin(ssid, pass);
  pinMode(wifiConnectedLED, OUTPUT);
  pinMode(wifiNotConnectedLED, OUTPUT);
  checkWiFiStatus();

  // MPU6050 Init
  if (!mpu.begin()) {
    Serial.println("Failed to initialize MPU6050!");
    while (1);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  Serial.println("MPU6050 initialized");

  // MAX30102 Init
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Please check wiring.");
    while (1);
  }
  Serial.println("Place your index finger on the sensor with steady pressure.");
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop() {
  checkWiFiStatus();

  // --- Heart Rate Detection (fast loop) ---
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();
  bool fingerPresent = irValue > 10000;

  // Only process BPM if finger is present
  if (fingerPresent) {
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      if (beatsPerMinute < 255 && beatsPerMinute > 20) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;
        //Take average of readings
        beatAvg = 0;
        for (byte x = 0 ; x < RATE_SIZE ; x++)
          beatAvg += rates[x];
        beatAvg /= RATE_SIZE;
      }
    }
  } else {
    beatsPerMinute = 0;
    beatAvg = 0;
  }

  // --- Other Sensors: Update every 1 second ---
  static unsigned long lastSensorUpdate = 0;
  static float temperatureC = 0;
  static float spo2 = 0;
  if (millis() - lastSensorUpdate >= 1000) {
    lastSensorUpdate = millis();

    // LM35 Temperature
    int analogValue = analogRead(LM35_PIN);
    temperatureC = (analogValue * 3.3 / 4095.0) * 100.0;

    // SpO2 Estimation (Basic Ratio-of-Ratios)
    spo2 = 0;
    if (irValue > 10000 && redValue > 10000) {
      float ratio = (float)redValue / (float)irValue;
      spo2 = 110.0 - 25.0 * ratio;
      if (spo2 > 100) spo2 = 100;
      if (spo2 < 70) spo2 = 70;
    }

    // MPU6050 Motion Detection
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    bool motionDetected = abs(g.gyro.x) > movementThreshold || abs(g.gyro.y) > movementThreshold || abs(g.gyro.z) > movementThreshold;
    if (motionDetected) {
      if (g.gyro.y > movementThreshold) {
        positionStatus = "Right";
      } else if (g.gyro.y < -movementThreshold) {
        positionStatus = "Left";
      }
      sendMotionAlert();
    } else if (millis() - lastMotionTime >= noMotionThreshold) {
      positionStatus = "Supine Position";
      sendNoMotionAlert();
    }
  }

  // --- Print only on change ---
  // Finger presence
  if (fingerPresent != lastFingerPresent) {
    if (fingerPresent) Serial.println("Finger detected!");
    else Serial.println("No finger?");
    lastFingerPresent = fingerPresent;
  }
  // BPM/Avg BPM
  if (fingerPresent && (abs(beatsPerMinute - lastBPM) > 1 || abs(beatAvg - lastAvgBPM) > 1)) {
    Serial.print("BPM=");
    Serial.print(beatsPerMinute);
    Serial.print(", Avg BPM=");
    Serial.println(beatAvg);
    lastBPM = beatsPerMinute;
    lastAvgBPM = beatAvg;
  }
  // SpO2
  if (abs(spo2 - lastSpO2) > 0.5) {
    Serial.print("SpO2 (%): ");
    Serial.println(spo2);
    lastSpO2 = spo2;
  }
  // Temperature
  if (abs(temperatureC - lastTemp) > 0.2) {
    Serial.print("LM35 Temp (°C): ");
    Serial.println(temperatureC);
    lastTemp = temperatureC;
  }
  // Position
  if (positionStatus != lastPosition) {
    Serial.println("Position: " + positionStatus);
    lastPosition = positionStatus;
  }

  // --- Supabase HTTP Updates ---
  unsigned long now = millis();
  if (now - lastLiveUpdate >= LIVE_UPDATE_INTERVAL) {
    lastLiveUpdate = now;
    sendLiveData(beatAvg, spo2, temperatureC, positionStatus);
  }
  if (now - lastHistoryUpdate >= HISTORY_UPDATE_INTERVAL) {
    lastHistoryUpdate = now;
    sendHistoricalData(beatAvg, spo2, temperatureC, positionStatus);
  }
}

void checkWiFiStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(wifiConnectedLED, HIGH);
    digitalWrite(wifiNotConnectedLED, LOW);
  } else {
    digitalWrite(wifiConnectedLED, LOW);
    digitalWrite(wifiNotConnectedLED, HIGH);
    Serial.println("NOT WIFI CONNECTED");
  }
}

void sendNoMotionAlert() {
  Serial.println("No movement for 5 minutes. Sending alert...");
  lastMotionTime = millis();
}

void sendMotionAlert() {
  Serial.println("Movement detected!");
  lastMotionTime = millis();
}
