# 💤 Intelligent Sleep Tracking System 

## 📘 Overview

The **Intelligent Sleep Tracking System** is an IoT and AI-powered solution designed to monitor and analyze the **sleep patterns and posture** of individuals, especially those suffering from **Alzheimer’s or dementia**.
By integrating real-time IoT data with machine learning insights, the system helps caregivers track patient behavior, detect irregularities, and receive timely alerts for better healthcare management.


## 🚀 Key Features

* 🧠 **AI-Powered dependability Detection** – Classifies the dependability of the caregiver as **High**, **Medium**, or **Low** using trained ML models.
* 📡 **IoT-Based Monitoring** – Collects live data from sensors via **ESP32**:

  * **MAX30102** – Heart rate and SpO₂ levels
  * **MPU6050** – Orientation and movement
  * **LM35** – Temperature readings
* 🌐 **Real-Time Dashboard** – Displays live metrics, trends, and alerts via a **React.js frontend**.
* ☁️ **Cloud Integration (Supabase)** – Secure data storage and retrieval for patient records and history.
* 🧩 **Flask API with ML Model** – Predicts patient dependability from input data or reports.
* 📊 **Data Visualization & Reports** – Generates **PDF and Excel reports** for healthcare professionals.
* 🔔 **Alert System** – Sends notifications when abnormal sleep patterns or risk indicators are detected.

---

## 🧠 System Architecture

```
+---------------------+
|   Patient (IoT)     |
| ESP32 + Sensors     |
+----------+----------+
           |
           ▼
+---------------------+
|   Flask API (ML)    |
| Data preprocessing  |
| ML prediction model |
+----------+----------+
           |
           ▼
+---------------------+
|   Supabase DB       |
| Store patient data  |
+----------+----------+
           |
           ▼
+---------------------+
| React Frontend UI   |
| Real-time dashboard |
| Reports & alerts    |
+---------------------+
```


## 🧩 Tech Stack

| Layer                | Technologies Used                            |
| -------------------- | -------------------------------------------- |
| **Frontend**         | React.js, Axios, Chart.js, TailwindCSS       |
| **Backend**          | Node.js (API Gateway), Flask (ML API)        |
| **Database**         | Supabase (PostgreSQL-based)                  |
| **IoT Layer**        | ESP32, MAX30102, MPU6050, LM35               |
| **Machine Learning** | Python (scikit-learn, pandas, NumPy, joblib) |
| **Visualization**    | jsPDF, autoTable, Recharts                   |
| **Version Control**  | Git & GitHub                                 |


## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/intelligent-sleep-tracking-system.git
cd intelligent-sleep-tracking-system
```

### 2️⃣ Setup Backend (Flask API)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3️⃣ Setup Frontend (React)

```bash
cd frontend
npm install
npm start
```

### 4️⃣ Configure Environment Variables

Create a `.env` file in both `backend/` and `frontend/` with your Supabase keys and Flask/Node endpoints:

SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_supabase_key>
FLASK_API_URL=http://localhost:5000
```

## 🧪 Machine Learning Model

The **PatientDependabilityClassifier** model uses collected physiological and posture data to:

* Predict **dependability score** of patients (High, Medium, Low).
* Classify **sleep posture** (Left, Right, Supine).
* Detect anomalies for early intervention.

Trained on custom datasets collected via simulated IoT sensors.


## 📊 Dashboard Preview

The web dashboard includes:

* Real-time graphs for Heart Rate, SpO₂, and Temperature.
* Posture tracking indicators.
* Alerts for abnormal patterns.
* Data export to PDF/Excel.


## 🧰 Future Enhancements

* 🕵️‍♂️ Integration with **Edge AI** for on-device inference.
* 📱 Mobile App for caregiver alerts.
* 🔍 Sleep quality scoring and insights.
* ☁️ AWS/Azure IoT Core support.


## 👩‍💻 Contributors

* **Dr. M Sridevi** -Project Guide
*  **Afreen Taj** – Project Lead
* **Abhishek** -Team Member


## 📜 License

This project is licensed under the **MIT License** 

---

## 🌟 Acknowledgements

* YBI Foundation (AI & Generative AI Internship)
* Supabase for cloud infrastructure
* OpenAI for AI-assisted development
* Open-source sensor libraries and contributors
