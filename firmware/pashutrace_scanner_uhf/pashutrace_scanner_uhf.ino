/*
 * PashuTrace handheld scanner — UHF version (for the HID Glass Tag UHF / any EPC Gen2 chip)
 *
 * UART UHF reader module (YRM100 / R200 family, "BB ... 7E" frames) -> ESP32 -> OLED + buzzer + BLE.
 * Sends  {"device":"PASHUTRACE-01","event":"TAG_SCANNED","animal_id":"<EPC hex>"}\n  over BLE (Nordic UART).
 *
 * Wiring:  Reader TX -> GPIO16 (RX2) · Reader RX -> GPIO17 (TX2) · OLED SDA/SCL -> GPIO21/22 · Buzzer -> GPIO25
 * Libraries: Adafruit SSD1306, Adafruit GFX (BLE ships with the ESP32 core).
 *
 * IMPORTANT
 *  - Use a reader module and antenna tuned to YOUR region's UHF band (India 865–867 MHz, EU 865–868 MHz,
 *    US 902–928 MHz). Check local regulations and the module's datasheet.
 *  - The single-poll command and frame layout below match the common YRM100/R200 protocol:
 *      poll  : BB 00 22 00 00 22 7E
 *      reply : BB 02 22 00 <PL> <RSSI> <PC 2B> <EPC n bytes> <CRC 2B> <checksum> 7E
 *    Verify against your module's datasheet and adapt readEpc() if it differs.
 *  - Read distance depends on the reader, antenna and the animal's body; test with real animals/chips.
 */
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME  "PASHUTRACE-01"
#define RFID_RX_PIN  16
#define RFID_TX_PIN  17
#define BUZZER_PIN   25
#define POLL_MS      250
#define DEBOUNCE_MS  2500

#define SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define TX_UUID      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

Adafruit_SSD1306 display(128, 64, &Wire, -1);
BLECharacteristic *txChar = nullptr;
volatile bool connected = false;
String lastTag;
unsigned long lastTagAt = 0, lastPoll = 0;

class ServerCb : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { connected = true; }
  void onDisconnect(BLEServer *s) override { connected = false; s->getAdvertising()->start(); }
};

void beep(int ms) { digitalWrite(BUZZER_PIN, HIGH); delay(ms); digitalWrite(BUZZER_PIN, LOW); }

void show(const String &a, const String &b = "", const String &c = "") {
  display.clearDisplay(); display.setTextColor(SSD1306_WHITE); display.setTextSize(1);
  display.setCursor(0, 0);  display.print("PashuTrace "); display.print(connected ? "BLE:ON" : "BLE:--");
  display.setCursor(0, 18); display.print(a);
  display.setCursor(0, 32); display.print(b);
  display.setCursor(0, 46); display.print(c);
  display.display();
}

// Sends one poll and returns the EPC as upper-case hex, or "" if no chip answered.
String readEpc() {
  static const uint8_t poll[] = {0xBB, 0x00, 0x22, 0x00, 0x00, 0x22, 0x7E};
  while (Serial2.available()) Serial2.read();
  Serial2.write(poll, sizeof(poll));
  uint8_t f[64]; size_t n = 0; unsigned long t0 = millis();
  while (millis() - t0 < 120 && n < sizeof(f)) {
    if (Serial2.available()) { f[n++] = Serial2.read(); if (f[n - 1] == 0x7E && n > 6) break; }
  }
  // Valid tag notification: BB 02 22 00 PL ...  (a "no tag" reply uses type 0x01 / cmd 0xFF)
  if (n < 12 || f[0] != 0xBB || f[1] != 0x02 || f[2] != 0x22) return "";
  size_t pl = ((size_t)f[3] << 8) | f[4];
  if (pl < 5 || 5 + pl + 2 > n) return "";
  size_t epcLen = pl - 1 /*RSSI*/ - 2 /*PC*/ - 2 /*CRC*/;
  const uint8_t *epc = &f[5 + 1 + 2];
  String hex;
  for (size_t i = 0; i < epcLen; i++) { char b[3]; snprintf(b, sizeof(b), "%02X", epc[i]); hex += b; }
  return hex;
}

void sendTag(const String &id) {
  String json = String("{\"device\":\"") + DEVICE_NAME + "\",\"event\":\"TAG_SCANNED\",\"animal_id\":\"" + id + "\"}\n";
  Serial.print(json);
  if (connected && txChar) {
    for (size_t i = 0; i < json.length(); i += 20) {
      txChar->setValue((uint8_t *)json.c_str() + i, min((size_t)20, json.length() - i));
      txChar->notify(); delay(10);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RFID_RX_PIN, RFID_TX_PIN);   // YRM100/R200 default 115200
  pinMode(BUZZER_PIN, OUTPUT);
  Wire.begin(); display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer(); server->setCallbacks(new ServerCb());
  BLEService *svc = server->createService(SERVICE_UUID);
  txChar = svc->createCharacteristic(TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  txChar->addDescriptor(new BLE2902()); svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising(); adv->addServiceUUID(SERVICE_UUID); adv->setScanResponse(true); adv->start();
  show("Ready", "Hold reader near", "the animal"); beep(80);
}

void loop() {
  if (millis() - lastPoll >= POLL_MS) {
    lastPoll = millis();
    String id = readEpc();
    if (id.length() >= 16 && (id != lastTag || millis() - lastTagAt > DEBOUNCE_MS)) {
      lastTag = id; lastTagAt = millis();
      show("CHIP READ", id.substring(0, 12), id.substring(12) + (connected ? "  >phone" : ""));
      beep(120); sendTag(id);
    }
  }
  if (lastTagAt && millis() - lastTagAt > 4000) { lastTagAt = 0; show("Ready", "Hold reader near", "the animal"); }
}
