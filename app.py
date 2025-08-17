from flask import Flask, jsonify
import subprocess
from flask import Flask, request, jsonify
from selenium import webdriver
from selenium.webdriver.common.by import By
import threading
import time






# app.py


app = Flask(__name__)
@app.route('/opencalculator')
def open_calculator():
    subprocess.Popen(["C:\\Windows\\System32\\calc.exe"])
    return jsonify({"status": "Calculator opened."})
driver = None
latest_message = {}


@app.route('/whatsapp-login')
def login_whatsapp():
    global driver
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(options=options)
    driver.get("https://web.whatsapp.com")
    return jsonify({"status": "Scan QR code in opened browser."})

def listen_for_messages():
    global latest_message
    while True:
        try:
            unread_chats = driver.find_elements(By.CLASS_NAME, "_1pJ9J")
            if unread_chats:
                unread_chats[0].click()
                time.sleep(2)
                sender = driver.find_element(By.CLASS_NAME, "_21S-L").text
                messages = driver.find_elements(By.CLASS_NAME, "_21Ahp")
                msg = messages[-1].text
                if latest_message.get("message") != msg:
                    latest_message = {"sender": sender, "message": msg, "ready": True}
        except:
            pass
        time.sleep(10)

@app.route('/check-message')
def check_message():
    if latest_message.get("ready"):
        return jsonify({"new": True, "sender": latest_message["sender"], "message": latest_message["message"]})
    else:
        return jsonify({"new": False})

@app.route('/send-reply', methods=["POST"])
def send_reply():
    global latest_message
    reply = request.json.get("reply", "")
    try:
        input_box = driver.find_element(By.XPATH, '//div[@title="Type a message"]')
        input_box.send_keys(reply)
        send_button = driver.find_element(By.XPATH, '//button[@aria-label="Send"]')
        send_button.click()
        latest_message = {}  # clear after reply
        return jsonify({"status": "Reply sent."})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    threading.Thread(target=listen_for_messages, daemon=True).start()
    app.run(port=5000)
    app.run(debug=True)
