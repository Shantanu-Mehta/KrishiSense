#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials - CHANGE THESE TO YOUR NETWORK
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverIP = "192.168.1.100";  // CHANGE TO YOUR SERVER IP
const int serverPort = 5000;
const String serverURL = "http://" + String(serverIP) + ":" + String(serverPort) + "/api/esp32";

// Device configuration
const String deviceId = "ESP32_FIELD_01";

// Pin definitions
#define SOIL_MOISTURE_PIN 34  // Analog input
#define PH_SENSOR_PIN 35      // Analog input
#define WATER_LEVEL_PIN 32    // Analog input
#define DHT_PIN 4             // Digital input
#define RELAY_PIN 26          // Digital output

// DHT sensor setup
#define DHT_TYPE DHT11        // or DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Timing
const unsigned long SEND_INTERVAL = 30000;  // 30 seconds
unsigned long lastSendTime = 0;

// Pump control variables
bool pumpRunning = false;
unsigned long pumpStartTime = 0;
int pumpDurationMinutes = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Smart Irrigation System Starting...");

  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Pump OFF initially

  // Initialize DHT sensor
  dht.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: " + WiFi.localIP().toString());
}

void loop() {
  // Handle pump timing
  if (pumpRunning) {
    unsigned long currentTime = millis();
    if (currentTime - pumpStartTime >= (pumpDurationMinutes * 60 * 1000UL)) {
      // Time to turn off pump
      digitalWrite(RELAY_PIN, LOW);
      pumpRunning = false;
      Serial.println("Pump turned OFF after " + String(pumpDurationMinutes) + " minutes");
    }
  }

  // Send data every 30 seconds
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = millis();
  }

  delay(1000);  // Small delay to prevent overwhelming the loop
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  // Read sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  int phRaw = analogRead(PH_SENSOR_PIN);
  int waterLevelRaw = analogRead(WATER_LEVEL_PIN);

  // Convert readings
  float soilMoisturePercent = map(soilMoistureRaw, 0, 4095, 100, 0);  // Higher reading = drier soil
  float phValue = (phRaw / 4095.0) * 14.0;
  float waterLevelPercent = map(waterLevelRaw, 0, 4095, 0, 100);

  // Check for sensor errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Print readings to Serial
  Serial.println("=== Sensor Readings ===");
  Serial.println("Temperature: " + String(temperature) + " °C");
  Serial.println("Humidity: " + String(humidity) + " %");
  Serial.println("Soil Moisture: " + String(soilMoisturePercent) + " %");
  Serial.println("pH: " + String(phValue));
  Serial.println("Water Level: " + String(waterLevelPercent) + " %");
  Serial.println("Pump Status: " + String(pumpRunning ? "ON" : "OFF"));

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soilMoisturePercent;
  doc["ph"] = phValue;
  doc["water_level"] = waterLevelPercent;
  doc["rainfall"] = 0;
  doc["crop_type"] = "wheat";

  String jsonString;
  serializeJson(doc, jsonString);

  // Send HTTP POST request
  HTTPClient http;
  http.begin(serverURL + "/data");
  http.addHeader("Content-Type", "application/json");

  Serial.println("Sending data to server...");
  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Server Response: " + response);

    // Parse server response
    StaticJsonDocument<128> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      String command = responseDoc["command"];
      int duration = responseDoc["duration_minutes"];

      Serial.println("Command: " + command + ", Duration: " + String(duration) + " minutes");

      if (command == "PUMP_ON" && duration > 0) {
        digitalWrite(RELAY_PIN, HIGH);
        pumpRunning = true;
        pumpStartTime = millis();
        pumpDurationMinutes = duration;
        Serial.println("Pump turned ON for " + String(duration) + " minutes");
      } else if (command == "PUMP_OFF") {
        digitalWrite(RELAY_PIN, LOW);
        pumpRunning = false;
        Serial.println("Pump turned OFF");
      }
    } else {
      Serial.println("Failed to parse server response");
    }
  } else {
    Serial.println("Error sending POST request: " + String(httpResponseCode));
  }

  http.end();
  Serial.println("=== End Transmission ===\n");
}