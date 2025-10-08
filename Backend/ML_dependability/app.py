#app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from classifier import PatientDependabilityClassifier
import os
import fitz
import re

app = Flask(__name__)
CORS(app)

# Load pre-trained model and encoders
model = PatientDependabilityClassifier()
model.load_models(filepath_prefix='models/patient_dependability_model')

def convert_temperature_to_celsius(temp_value):
    """Convert temperature to normal body temperature range if needed"""
    if temp_value < 30:  # Likely sensor reading, convert to body temp
        normalized = ((temp_value - 15) / (31 - 15)) * (38 - 36) + 36
        return round(normalized, 1)
    return temp_value

def extract_data_from_pdf(pdf_path):
    """Extract vitals and posture info from PDF"""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    # Default values
    heart_rate = 75
    spo2 = 96
    temperature = 36.8
    current_posture = "Supine"
    left_pct, right_pct, supine_pct = 30.0, 30.0, 40.0

    try:
        temp_pattern = r'(\d+\.\d+)°C'
        temp_matches = re.findall(temp_pattern, text)
        if temp_matches:
            temp_raw = float(temp_matches[0])
            temperature = convert_temperature_to_celsius(temp_raw)

        if "Heart Rate:" in text:
            hr_text = text.split("Heart Rate:")[1].split("\n")[0].strip()
            if hr_text and hr_text != "--" and "Not Available" not in hr_text:
                heart_rate = float(re.findall(r'\d+', hr_text)[0])

        if "SpO2" in text:
            spo2_text = text.split("SpO2")[1].split("\n")[0].strip()
            if spo2_text and spo2_text != "--" and "Not Available" not in spo2_text:
                spo2 = float(re.findall(r'\d+', spo2_text)[0])

        if "Left" in text and "%" in text:
            left_match = re.search(r'Left\s+\d+\s+(\d+)%', text)
            if left_match:
                left_pct = float(left_match.group(1))

        if "Right" in text and "%" in text:
            right_match = re.search(r'Right\s+\d+\s+(\d+)%', text)
            if right_match:
                right_pct = float(right_match.group(1))

        if "Supine" in text and "%" in text:
            supine_match = re.search(r'Supine Position\s+\d+\s+(\d+)%', text)
            if supine_match:
                supine_pct = float(supine_match.group(1))

        if "Most Common Sleep Position:" in text:
            posture_line = text.split("Most Common Sleep Position:")[1].split("\n")[0].strip()
            if "Left" in posture_line:
                current_posture = "Left"
            elif "Right" in posture_line:
                current_posture = "Right"
            elif "Supine" in posture_line:
                current_posture = "Supine"

        total_pct = left_pct + right_pct + supine_pct
        if total_pct > 0:
            left_pct = (left_pct / total_pct) * 100
            right_pct = (right_pct / total_pct) * 100
            supine_pct = (supine_pct / total_pct) * 100

    except Exception as e:
        print("WARNING: Extraction error:", str(e))

    return heart_rate, spo2, temperature, current_posture, left_pct, right_pct, supine_pct


@app.route('/predict', methods=['POST'])
def predict_from_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    temp_path = os.path.join("temp.pdf")
    file.save(temp_path)

    try:
        heart_rate, spo2, temperature, current_posture, left_pct, right_pct, supine_pct = extract_data_from_pdf(temp_path)

        prediction, probabilities = model.predict_dependability(
            heart_rate=heart_rate,
            spo2=spo2,
            temperature=temperature,
            current_posture=current_posture,
            left_pct=left_pct,
            right_pct=right_pct,
            supine_pct=supine_pct
        )

        os.remove(temp_path)

        return jsonify({
            'prediction': prediction,
            'probabilities': probabilities,
            'input_data': {
                'heart_rate': heart_rate,
                'spo2': spo2,
                'temperature': temperature,
                'current_posture': current_posture,
                'left_pct': round(left_pct, 1),
                'right_pct': round(right_pct, 1),
                'supine_pct': round(supine_pct, 1)
            }
        })

    except Exception as e:
        print("ERROR: Prediction error:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/test-predict', methods=['POST'])
def test_predict():
    data = request.get_json()

    prediction, probabilities = model.predict_dependability(
        heart_rate=data.get('heart_rate', 75),
        spo2=data.get('spo2', 96),
        temperature=data.get('temperature', 36.8),
        current_posture=data.get('current_posture', 'Left'),
        left_pct=data.get('left_pct', 30.0),
        right_pct=data.get('right_pct', 30.0),
        supine_pct=data.get('supine_pct', 40.0)
    )

    return jsonify({
        'prediction': prediction,
        'probabilities': probabilities,
        'input_data': data
    })


@app.route('/')
def home():
    """Health check endpoint for Render"""
    return jsonify({"message": "Backend is running successfully 🚀"}), 200


if __name__ == '__main__':
    # ⚙️ On Render, Flask needs to run on the port Render provides
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
