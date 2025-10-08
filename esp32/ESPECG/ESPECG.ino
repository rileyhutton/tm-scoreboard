#include <WiFi.h>
#include <WebSocketsServer.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

struct Config {
  float thresholdPercentage;
  int refractoryPeriod;
  float slopeThreshold;
  float baselineInit;
};

Config config;
bool shouldReboot = false;

WebServer server(80);  // Regular HTTP server on port 80

// Configuration
#define ECG_PIN 34
#define LO_PLUS_PIN 32
#define LO_MINUS_PIN 33
const char* ssid = "dingus-net lite";
const char* password = "happyLittlecl0uds";
const char* deviceHostname = "ECG-ESP32";
const int websocketPort = 81;

WebSocketsServer webSocket = WebSocketsServer(websocketPort);

// Heart Rate Detection
volatile int bpm = 0;
volatile unsigned long lastPeakTime = 0;
const int sampleWindow = 4; // 250Hz (4ms per sample)
const int refractoryPeriod = 200; // ms (minimum time between beats)
float threshold = 700;
const float thresholdMultiplier = 1.5;
bool peakDetected = false;


// Adjust these values in your configuration
const float baselineInit = 2500.0;    // Initial baseline estimate (match your inverted signal range)
const float slopeThreshold = -5.0;    // Minimum downward slope for detection
const float thresholdPercentage = 0.3; // How far below baseline to set threshold

// Initialize baseline in global variables
float baseline = baselineInit;

// Signal Filtering
const int filterSize = 10;
int filterBuffer[filterSize];
int filterIndex = 0;
int filteredValue = 0;

// System Status
bool leadsConnected = true;
bool wifiConnected = false;
unsigned long lastStatusUpdate = 0;
const int statusUpdateInterval = 1000;

void setup() {
  Serial.begin(115200);

  EEPROM.begin(sizeof(Config));
  loadConfig();
  
  pinSetup();
  connectToWiFi();
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  // Add to setup():
  server.on("/", []() {
    String html = "<h1>ECG Monitor Debug</h1>";
    html += "<p>WS Endpoint: ws://" + WiFi.localIP().toString() + ":81</p>";
    html += "<p>Leads Status: " + String(leadsConnected ? "OK" : "DISCONNECTED") + "</p>";
    html += "<p>Current BPM: " + String(bpm) + "</p>";
    server.send(200, "text/html", html);
  });
  
  server.on("/reboot", []() {
    server.send(200, "text/plain", "Rebooting...");
    delay(100);
    ESP.restart();
  });

  server.on("/settings", HTTP_ANY, handleSettings);
  server.on("/config", handleControlPanel); 
  
  server.begin();  // Start HTTP server
}

void loop() {
  webSocket.loop();
  checkSystemStatus();
  processECG();
  server.handleClient();  // Add this line in loop()
  handleHeartbeat();
  if (shouldReboot) {
    delay(100);
    ESP.restart();
  }

}

void loadConfig() {
  EEPROM.get(0, config);
  if (isnan(config.thresholdPercentage) || 
      config.refractoryPeriod < 100 || 
      config.refractoryPeriod > 1000) {
    // Defaults if no valid config
    config = {0.3, 200, -5.0, 2500.0};
  }
}

void saveConfig() {
  EEPROM.put(0, config);
  EEPROM.commit();
}

void handleSettings() {
  if (server.method() == HTTP_POST) {
    DynamicJsonDocument doc(256);
    deserializeJson(doc, server.arg("plain"));
    
    config.thresholdPercentage = doc["threshold"] | 0.3;
    config.refractoryPeriod = doc["refractory"] | 200;
    config.slopeThreshold = doc["slope"] | -5.0;
    config.baselineInit = doc["baseline"] | 2500.0;
    
    saveConfig();
    server.send(200, "text/plain", "Settings saved");
    shouldReboot = true;
  } else {
    DynamicJsonDocument doc(256);
    doc["threshold"] = config.thresholdPercentage;
    doc["refractory"] = config.refractoryPeriod;
    doc["slope"] = config.slopeThreshold;
    doc["baseline"] = config.baselineInit;
    
    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
  }
}

void handleControlPanel() {
  String html = R"(
  <html>
    <body>
      <h1>ECG Settings</h1>
      <form onsubmit="save(event)">
        Threshold (%): <input type="number" step="0.1" id="threshold" required><br>
        Refractory (ms): <input type="number" id="refractory" required><br>
        Slope Threshold: <input type="number" step="0.1" id="slope" required><br>
        Baseline: <input type="number" id="baseline" required><br>
        <button type="submit">Save</button>
      </form>
      <script>
        fetch('/settings').then(r => r.json()).then(config => {
          document.getElementById('threshold').value = config.threshold;
          document.getElementById('refractory').value = config.refractory;
          document.getElementById('slope').value = config.slope;
          document.getElementById('baseline').value = config.baseline;
        });
        
        function save(e) {
          e.preventDefault();
          const data = {
            threshold: parseFloat(document.getElementById('threshold').value),
            refractory: parseInt(document.getElementById('refractory').value),
            slope: parseFloat(document.getElementById('slope').value),
            baseline: parseFloat(document.getElementById('baseline').value)
          };
          
          fetch('/settings', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
          }).then(() => alert('Saved! Device will reboot'));
        }
      </script>
    </body>
  </html>)";
  
  server.send(200, "text/html", html);
}

void handleHeartbeat() {
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat >= 5000) {
    lastHeartbeat = millis();
    sendWebSocketData("alive");
  }
}

void pinSetup() {
  pinMode(ECG_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT_PULLUP);
  pinMode(LO_MINUS_PIN, INPUT_PULLUP);
}

void processECG() {
  static unsigned long lastSample = 0;
  static int previousValue = 0;
  static bool potentialPeak = false;
  
  if (millis() - lastSample >= sampleWindow) {
    lastSample = millis();
    
    // Read and invert signal (assuming negative peaks need flipping)
    int rawValue = 4095 - analogRead(ECG_PIN); // Invert for 12-bit ADC (change to 1023 for 10-bit)
    filteredValue = movingAverage(rawValue);

    sendWebSocketData("ecg:" + String(filteredValue));

    // Dynamic thresholding for negative peaks
    float baseline = 0.95 * baseline + 0.05 * filteredValue;  // Baseline tracking
    threshold = baseline - (baseline * config.thresholdPercentage);  // Threshold 30% below baseline
    
    // Slope detection for improved accuracy
    int slope = filteredValue - previousValue;
    previousValue = filteredValue;

    // Peak detection logic
    if (!peakDetected) {
      if (filteredValue < threshold && slope < config.slopeThreshold) {  // Negative threshold crossing with negative slope
        potentialPeak = true;
      }
      
      if (potentialPeak && (slope >= 0)) {  // Look for slope reversal
        if (millis() - lastPeakTime > refractoryPeriod) {
          handlePeakDetection();
        }
        peakDetected = true;
        potentialPeak = false;
      }
    } else {
      // Reset detection when signal returns above threshold
      if (filteredValue > (threshold + (baseline * 0.2))) {
        peakDetected = false;
      }
    }
  }
}

int movingAverage(int newValue) {
  filterBuffer[filterIndex] = newValue;
  filterIndex = (filterIndex + 1) % filterSize;
  
  long sum = 0;
  for (int i = 0; i < filterSize; i++) {
    sum += filterBuffer[i];
  }
  return sum / filterSize;
}

void handlePeakDetection() {
  unsigned long currentTime = millis();
  if (lastPeakTime != 0) {
    int interval = currentTime - lastPeakTime;
    if (interval > 0) {
      bpm = 60000 / interval; // Calculate BPM
      bpm = constrain(bpm, 30, 200); // Validate realistic range
      sendWebSocketData("bpm:" + String(bpm));
    }
  }
  lastPeakTime = currentTime;
}

void checkSystemStatus() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck >= 500) {
    lastCheck = millis();
    
    // Check leads
    bool newLeadStatus = !(digitalRead(LO_PLUS_PIN) || digitalRead(LO_MINUS_PIN));
    if (newLeadStatus != leadsConnected) {
      leadsConnected = newLeadStatus;
      sendWebSocketData(leadsConnected ? "leads:ok" : "leads:disconnected");
    }

    // Check WiFi
    bool newWifiStatus = WiFi.status() == WL_CONNECTED;
    if (newWifiStatus != wifiConnected) {
      wifiConnected = newWifiStatus;
      sendWebSocketData(wifiConnected ? "wifi:connected" : "wifi:disconnected");
      if (!wifiConnected) connectToWiFi();
    }
  }
}

void sendWebSocketData(String message) {
  webSocket.broadcastTXT(message);
  Serial.println(message);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED:
      Serial.printf("[%u] Connection established\n", num);
      sendWebSocketData(leadsConnected ? "leads:ok" : "leads:disconnected");
      break;
    case WStype_TEXT:
      Serial.printf("[%u] Received text: %s\n", num, payload);
      break;
    case WStype_ERROR:
      Serial.printf("[%u] Error!\n", num);
      break;
  }
}

void connectToWiFi() {
  WiFi.setHostname(deviceHostname);
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
      delay(500);
      Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
    } else {
      Serial.println("\nFailed to connect!");
    }
  }
}
