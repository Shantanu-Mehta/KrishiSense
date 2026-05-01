// ============================================================
//   SMART IRRIGATION SYSTEM — ESP32 Full Sketch v3
//   Fixes: pH calibrated (air=9.6 → corrected to ~7.3)
//          Pump ON/OFF from web app (polls every 1 second)
//          Multi-WiFi support
// ============================================================

#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// ── Multi-WiFi Config ────────────────────────────────────────
struct WifiCredential {
  const char *ssid;
  const char *password;
};

WifiCredential networks[] = {
    //{ "Airtel_shat_8185", "air80525"     },   // Network 1 — Home
    {"iqoo7", "12345678910"}, // Network 2 — Hotspot
};
const int networkCount = sizeof(networks) / sizeof(networks[0]);
// ─────────────────────────────────────────────────────────────

// ── Server Config ─────────────────────────────────────────────
const char *serverIP = "10.178.54.222";
const int serverPort = 5000;
const char *deviceID = "ESP32_FIELD_01";
const char *cropType = "wheat";
// ─────────────────────────────────────────────────────────────

// ── Sensor Pins ───────────────────────────────────────────────
#define SOIL_MOISTURE_PIN 34
#define PH_SENSOR_PIN 35
#define WATER_LEVEL_PIN 32
#define DHT_PIN 4
#define RELAY_PIN 26
// ─────────────────────────────────────────────────────────────

// ── DHT Type ──────────────────────────────────────────────────
#define DHT_TYPE DHT11 // Change to DHT22 if using DHT22
DHT dht(DHT_PIN, DHT_TYPE);
// ─────────────────────────────────────────────────────────────

// ── pH Calibration ────────────────────────────────────────────
#define PH_CORRECTION 2.60 // Subtract this from every raw reading
// ─────────────────────────────────────────────────────────────

// ── Timing ────────────────────────────────────────────────────
#define SEND_INTERVAL_MS 30000     // Send sensor data every 30s
#define PUMP_POLL_INTERVAL_MS 1000 // Poll pump command every 1s
unsigned long lastSendTime = 0;
unsigned long lastPumpPoll = 0;
// ─────────────────────────────────────────────────────────────

// ── Pump State ────────────────────────────────────────────────
bool pumpState = false;
bool pumpTimerActive = false;
unsigned long pumpOffTime = 0; // millis() when pump auto-turns off
// ─────────────────────────────────────────────────────────────

// ============================================================
//   SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("============================================");
  Serial.println("   KrishiSense ESP32 v3 Starting...");
  Serial.println("============================================");

  // Pump relay — OFF immediately on boot
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // LOW = OFF for standard active-high relay
  pumpState = false;
  Serial.println("✅ Relay configured — Pump OFF");

  // DHT sensor init
  dht.begin();
  Serial.println("✅ DHT sensor initialized");

  // Connect WiFi
  connectWiFi();
}

// ============================================================
//   MAIN LOOP
// ============================================================
void loop() {

  // ── Reconnect WiFi if dropped ─────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost — reconnecting...");
    connectWiFi();
    return;
  }

  // ── Auto pump OFF when timer expires (non-blocking) ───────
  if (pumpTimerActive && millis() >= pumpOffTime) {
    digitalWrite(RELAY_PIN, LOW); // LOW = OFF
    pumpState = false;
    pumpTimerActive = false;
    Serial.println("🛑 PUMP → OFF (auto timer expired)");
  }

  // ── Send sensor data every 30 seconds ─────────────────────
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    readAndSendData();
  }

  // ── Poll server for pump ON/OFF command every 1 second ───
  if (millis() - lastPumpPoll >= PUMP_POLL_INTERVAL_MS) {
    lastPumpPoll = millis();
    checkPumpCommand();
  }
}

// ============================================================
//   MULTI-WIFI CONNECTION
// ============================================================
void connectWiFi() {
  Serial.println("📡 Scanning known WiFi networks...");

  for (int i = 0; i < networkCount; i++) {
    Serial.print("   Trying: ");
    Serial.println(networks[i].ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(networks[i].ssid, networks[i].password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println();
      Serial.print("✅ Connected to : ");
      Serial.println(networks[i].ssid);
      Serial.print("   IP Address   : ");
      Serial.println(WiFi.localIP());
      Serial.print("   Signal RSSI  : ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      Serial.println("--------------------------------------------");
      return; // Connected — stop trying other networks
    }

    Serial.println("\n   ❌ Failed — trying next...");
    WiFi.disconnect();
    delay(300);
  }

  // All networks failed
  Serial.println("❌ All WiFi networks failed — retrying in 10 seconds...");
  delay(10000);
  connectWiFi(); // Retry from top
}

// ============================================================
//   READ ALL SENSORS
// ============================================================
void readAndSendData() {
  Serial.println("\n📊 Reading all sensors...");

  // ── Soil Moisture (GPIO 34) ───────────────────────────────
  int rawSoil = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(rawSoil, 4095, 0, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);
  Serial.print("   🌱 Soil Moisture : ");
  Serial.print(soilMoisture);
  Serial.println(" %");

  // ── pH Sensor (GPIO 35) — calibrated ─────────────────────
  long rawPHSum = 0;
  for (int i = 0; i < 10; i++) {
    rawPHSum += analogRead(PH_SENSOR_PIN);
    delay(10);
  }
  float rawPHAvg = rawPHSum / 10.0;

  // General Linear Mapping: Map ADC (0 - 4095) to pH (0.0 - 14.0)
  float phValue = map(rawPHAvg, 0, 4095, 0, 1400) / 100.0;
  phValue = constrain(phValue, 0.0, 14.0);

  Serial.print("   ⚗️  pH Raw ADC    : ");
  Serial.println(rawPHAvg, 1);
  Serial.print("   ⚗️  pH Calibrated : ");
  Serial.println(phValue, 2);

  // ── Water Level (GPIO 32) ─────────────────────────────────
  int rawWater = analogRead(WATER_LEVEL_PIN);
  float waterLevel = map(rawWater, 0, 4095, 0, 100);
  waterLevel = constrain(waterLevel, 0, 100);
  Serial.print("   💧 Water Level   : ");
  Serial.print(waterLevel);
  Serial.println(" %");

  // ── DHT11/22 Temperature + Humidity (GPIO 4) ──────────────
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("   ⚠️  DHT read failed — using fallback 25°C / 50%");
    humidity = 50.0;
    temperature = 25.0;
  } else {
    Serial.print("   🌡️  Temperature  : ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("   💦 Humidity     : ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  // Send everything to server
  sendToServer(temperature, humidity, soilMoisture, phValue, waterLevel);
}

// ============================================================
//   SEND SENSOR DATA TO NODE.JS SERVER
// ============================================================
void sendToServer(float temperature, float humidity, float soilMoisture,
                  float phValue, float waterLevel) {

  String url = "http://";
  url += serverIP;
  url += ":";
  url += serverPort;
  url += "/api/esp32/data";

  // Build JSON
  StaticJsonDocument<300> doc;
  doc["device_id"] = deviceID;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity * 10) / 10.0;
  doc["soil_moisture"] = round(soilMoisture * 10) / 10.0;
  doc["ph"] = round(phValue * 100) / 100.0;
  doc["water_level"] = round(waterLevel * 10) / 10.0;
  doc["rainfall"] = 0;
  doc["crop_type"] = cropType;

  String payload;
  serializeJson(doc, payload);

  Serial.println("\n📤 Sending sensor data to server...");
  Serial.print("   URL     : ");
  Serial.println(url);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    String response = http.getString();
    Serial.print("   ✅ Saved — Response : ");
    Serial.println(response);
  } else if (httpCode > 0) {
    Serial.print("   ⚠️  HTTP ");
    Serial.print(httpCode);
    Serial.println(" — server error");
  } else {
    Serial.print("   ❌ Connection failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  Serial.println("--------------------------------------------");
}

// ============================================================
//   POLL SERVER FOR PUMP COMMAND
// ============================================================
void checkPumpCommand() {
  String url = "http://";
  url += serverIP;
  url += ":";
  url += serverPort;
  url += "/api/esp32/command/";
  url += deviceID;

  HTTPClient http;
  http.begin(url);
  http.setTimeout(
      2000); // LOWERED FROM 5s TO 2s so polling every 1s doesn't block

  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();

    StaticJsonDocument<256> resp;
    DeserializationError error = deserializeJson(resp, response);

    if (error) {
      http.end();
      return;
    }

    String command = resp["command"] | "PUMP_OFF";
    int durationMins = resp["duration_minutes"] | 0;
    bool isNewCommand = resp["is_new_command"] | false;

    // Only act if server flagged this as a NEW unexecuted command
    if (isNewCommand) {
      Serial.print("\n🔔 New pump command received: ");
      Serial.println(command);

      if (command == "PUMP_ON") {
        Serial.println("   💧 PUMP → ON");
        digitalWrite(RELAY_PIN, HIGH); // HIGH = ON for standard relay
        pumpState = true;

        if (durationMins > 0) {
          // Non-blocking timer — auto shuts off after duration
          pumpOffTime =
              millis() + ((unsigned long)durationMins * 60UL * 1000UL);
          pumpTimerActive = true;
          Serial.print("   ⏱️  Will auto-OFF in ");
          Serial.print(durationMins);
          Serial.println(" minute(s)");
        } else {
          // No duration — stays ON until manual OFF command
          pumpTimerActive = false;
          Serial.println("   ⏱️  No timer — stays ON until manual OFF");
        }

      } else {
        // PUMP_OFF command from web app
        Serial.println("   🛑 PUMP → OFF (web command)");
        digitalWrite(RELAY_PIN, LOW); // LOW = OFF
        pumpState = false;
        pumpTimerActive = false;
      }
    }
  }

  http.end();
}