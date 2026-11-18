/*
 * PashuTrace handheld scanner — ESP32 firmware
 *
 * Reads 134.2 kHz FDX-B (ISO 11784/85) ear tags from a UART RFID reader module,
 * shows the 15-digit animal ID on an SSD1306 OLED, beeps, and sends
 *   {"device":"PASHUTRACE-01","event":"TAG_SCANNED","animal_id":"356000123456789"}\n
 * over BLE (Nordic UART Service). The PashuTrace web app pairs with this
 * device from Chrome/Edge using Web Bluetooth and no internet connection is required.
 *
 * Wiring (adjust to your board / module):
 *   RFID module TX  -> ESP32 GPIO16 (RX2)
 *   RFID module RX  -> ESP32 GPIO17 (TX2)   (only if the module needs commands)
 *   OLED SDA/SCL    -> GPIO21 / GPIO22
 *   Buzzer (active) -> GPIO25
 *
 * Libraries (Arduino Library Manager): "Adafruit SSD1306", "Adafruit GFX Library".
 * BLE library comes with the ESP32 Arduino core.
 *
 * Reader output formats differ between modules. This sketch handles the common
 * ASCII frame:  STX(0x02) + 10 hex country/ID + ... + ETX(0x03), as well as a
 * plain 15-digit ASCII line. Check your module's datasheet and adapt
 * parseFrame() if it differs.
 */
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME   "PASHUTRACE-01"
#define RFID_RX_PIN   16
#define RFID_TX_PIN   17
#define BUZZER_PIN    25
#define OLED_W        128
#define OLED_H        64
#define DEBOUNCE_MS   2500   // ignore the same tag for this long

// Nordic UART Service UUIDs — must match the web app.
#define SERVICE_UUID  "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define TX_UUID       "6e400003-b5a3-f393-e0a9-e50e24dcca9e"  // notify (ESP32 -> phone)

Adafruit_SSD1306 display(OLED_W, OLED_H, &Wire, -1);
BLECharacteristic *txChar = nullptr;
volatile bool connected = false;
String lastTag;
unsigned long lastTagAt = 0;

class ServerCb : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { connected = true; }
  void onDisconnect(BLEServer *s) override { connected = false; s->getAdvertising()->start(); }
};

void beep(int ms) { digitalWrite(BUZZER_PIN, HIGH); delay(ms); digitalWrite(BUZZER_PIN, LOW); }

void show(const String &l1, const String &l2 = "", const String &l3 = "") {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);  display.print("PashuTrace  ");
  display.print(connected ? "BLE:ON" : "BLE:--");
  display.setCursor(0, 20); display.print(l1);
  display.setCursor(0, 34); display.print(l2);
  display.setCursor(0, 48); display.print(l3);
  display.display();
}

// Returns a 15-digit decimal string (country code 3 digits + national ID 12 digits) or "".
String parseFrame(const String &raw) {
  String digits;
  for (size_t i = 0; i < raw.length(); i++) if (isDigit(raw[i])) digits += raw[i];
  if (digits.length() == 15) return digits;
  // Hex frame: 10 hex chars = 38-bit national ID + 10-bit country code.
  String hex;
  for (size_t i = 0; i < raw.length(); i++) if (isxdigit(raw[i])) hex += raw[i];
  if (hex.length() >= 10) {
    String h = hex.substring(0, 10);
    uint64_t v = strtoull(h.c_str(), nullptr, 16);
    uint64_t national = v & 0x3FFFFFFFFFULL;      // lower 38 bits
    uint32_t country = (uint32_t)((v >> 38) & 0x3FF);
    char buf[24];
    snprintf(buf, sizeof(buf), "%03u%012llu", country, (unsigned long long)national);
    if (strlen(buf) == 15) return String(buf);
  }
  return "";
}

void sendTag(const String &id) {
  String json = String("{\"device\":\"") + DEVICE_NAME + "\",\"event\":\"TAG_SCANNED\",\"animal_id\":\"" + id + "\"}\n";
  Serial.print(json);
  if (connected && txChar) {
    // BLE notifications are limited by MTU; send in 20-byte chunks to be safe.
    for (size_t i = 0; i < json.length(); i += 20) {
      txChar->setValue((uint8_t *)json.c_str() + i, min((size_t)20, json.length() - i));
      txChar->notify();
      delay(10);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RFID_RX_PIN, RFID_TX_PIN);
  pinMode(BUZZER_PIN, OUTPUT);
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) Serial.println("OLED not found");

  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCb());
  BLEService *svc = server->createService(SERVICE_UUID);
  txChar = svc->createCharacteristic(TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  txChar->addDescriptor(new BLE2902());
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();

  show("Ready", "Hold near ear tag", "(5-10 cm)");
  beep(80);
}

void loop() {
  static String buf;
  static unsigned long lastByte = 0;
  while (Serial2.available()) {
    char c = (char)Serial2.read();
    if (c == 0x02) buf = "";                       // STX starts a frame
    else if (c == 0x03 || c == '\n' || c == '\r') { // ETX / newline ends it
      if (buf.length()) {
        String id = parseFrame(buf);
        buf = "";
        if (id.length() == 15 && (id != lastTag || millis() - lastTagAt > DEBOUNCE_MS)) {
          lastTag = id; lastTagAt = millis();
          show("TAG SCANNED", id.substring(0, 3) + " " + id.substring(3), connected ? "Sent to phone" : "Pair the app");
          beep(120);
          sendTag(id);
        }
      }
    } else if (buf.length() < 40) buf += c;
    lastByte = millis();
  }
  if (buf.length() && millis() - lastByte > 300) buf = "";  // drop stale partial frames
  if (lastTagAt && millis() - lastTagAt > 4000) { lastTagAt = 0; show("Ready", "Hold near ear tag", "(5-10 cm)"); }
}
