import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

class PatientDependabilityClassifier:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.posture_encoder = LabelEncoder()
        self.ensemble_model = None
        self.feature_names = []
        
    def generate_dataset(self, n_samples=2000):
        """Generate realistic patient monitoring dataset"""
        np.random.seed(42)
        
        data = []
        dependability_labels = ['Low', 'Moderate', 'High']
        postures = ['Left', 'Right', 'Supine']
        
        for i in range(n_samples):
            # First determine dependability level to generate realistic data
            dependability = np.random.choice(dependability_labels, p=[0.4, 0.35, 0.25])
            
            # Generate features based on dependability level
            if dependability == 'Low':  # Independent patients
                heart_rate = np.random.normal(72, 8)  # Normal HR
                spo2 = np.random.normal(97, 2)  # Good oxygen saturation
                temperature = np.random.normal(36.8, 0.4)  # Normal temp
                # More varied posture distribution (active sleepers)
                left_pct = np.random.uniform(25, 40)
                right_pct = np.random.uniform(25, 40)
                supine_pct = 100 - left_pct - right_pct
                current_posture = np.random.choice(postures, p=[0.35, 0.35, 0.3])
                
            elif dependability == 'Moderate':  # Moderately dependent
                heart_rate = np.random.normal(78, 12)  # Slightly elevated HR
                spo2 = np.random.normal(94, 3)  # Lower oxygen saturation
                temperature = np.random.normal(37.1, 0.5)  # Slightly elevated temp
                # Less varied posture (some mobility issues)
                left_pct = np.random.uniform(20, 35)
                right_pct = np.random.uniform(20, 35)
                supine_pct = 100 - left_pct - right_pct
                current_posture = np.random.choice(postures, p=[0.3, 0.3, 0.4])
                
            else:  # High dependability
                heart_rate = np.random.normal(85, 15)  # Higher HR variability
                spo2 = np.random.normal(91, 4)  # Lower oxygen levels
                temperature = np.random.normal(37.3, 0.6)  # More temperature variation
                # Predominantly supine (limited mobility)
                supine_pct = np.random.uniform(60, 85)
                remaining = 100 - supine_pct
                left_pct = np.random.uniform(0, remaining)
                right_pct = remaining - left_pct
                current_posture = np.random.choice(postures, p=[0.15, 0.15, 0.7])
            
            # Add some noise and edge cases
            heart_rate = max(40, min(150, heart_rate))
            spo2 = max(80, min(100, spo2))
            temperature = max(35.5, min(39.5, temperature))
            
            # Normalize posture percentages
            total_pct = left_pct + right_pct + supine_pct
            left_pct = (left_pct / total_pct) * 100
            right_pct = (right_pct / total_pct) * 100
            supine_pct = (supine_pct / total_pct) * 100
            
            # Add some realistic correlations and edge cases
            if np.random.random() < 0.1:  # 10% chance of outliers
                if dependability == 'High':
                    heart_rate += np.random.uniform(10, 30)  # Stress/anxiety
                    spo2 -= np.random.uniform(3, 8)  # Respiratory issues
                elif dependability == 'Low' and np.random.random() < 0.3:
                    # Some healthy individuals with temporary issues
                    temperature += np.random.uniform(0.5, 1.5)  # Mild fever
            
            data.append({
                'heart_rate': round(heart_rate, 1),
                'spo2': round(spo2, 1),
                'temperature': round(temperature, 2),
                'current_posture': current_posture,
                'left_posture_pct': round(left_pct, 1),
                'right_posture_pct': round(right_pct, 1),
                'supine_posture_pct': round(supine_pct, 1),
                'dependability': dependability
            })
        
        df = pd.DataFrame(data)
        
        # Add derived features
        df['hr_spo2_ratio'] = df['heart_rate'] / df['spo2']
        df['temp_deviation'] = abs(df['temperature'] - 37.0)
        df['posture_mobility_score'] = (df['left_posture_pct'] + df['right_posture_pct']) / 100
        df['vital_stability_score'] = 1 / (1 + df['temp_deviation'] + abs(df['heart_rate'] - 72)/20)
        
        return df
    
    def predict_dependability(self, heart_rate, spo2, temperature, current_posture, 
                            left_pct, right_pct, supine_pct, model_name='Ensemble'):
        """Predict dependability for new patient data"""
        
        # Prepare input data
        input_data = pd.DataFrame({
            'heart_rate': [heart_rate],
            'spo2': [spo2],
            'temperature': [temperature],
            'current_posture': [current_posture],
            'left_posture_pct': [left_pct],
            'right_posture_pct': [right_pct],
            'supine_posture_pct': [supine_pct]
        })
        
        # Add derived features
        input_data['hr_spo2_ratio'] = input_data['heart_rate'] / input_data['spo2']
        input_data['temp_deviation'] = abs(input_data['temperature'] - 37.0)
        input_data['posture_mobility_score'] = (input_data['left_posture_pct'] + input_data['right_posture_pct']) / 100
        input_data['vital_stability_score'] = 1 / (1 + input_data['temp_deviation'] + abs(input_data['heart_rate'] - 72)/20)
        
        # Encode posture
        input_data['current_posture_encoded'] = self.posture_encoder.transform(input_data['current_posture'])
        
        # Select features
        X_input = input_data[self.feature_names]
        
        # Scale features
        X_input_scaled = self.scaler.transform(X_input)
        
        # Make prediction
        model = self.models[model_name]
        prediction = model.predict(X_input_scaled)[0]
        
        # Get prediction probabilities if available
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X_input_scaled)[0]
            prob_dict = dict(zip(model.classes_, probabilities))
        else:
            prob_dict = {prediction: 1.0}
        
        return prediction, prob_dict
        
    def load_models(self, filepath_prefix=r'C:\Users\Admin\Desktop\Backend\models\patient_dependability_model'):
        """Load trained models and preprocessors"""
        self.models = joblib.load(f'{filepath_prefix}_models.pkl')
        self.scaler = joblib.load(f'{filepath_prefix}_scaler.pkl')
        self.posture_encoder = joblib.load(f'{filepath_prefix}_posture_encoder.pkl')
        self.feature_names = joblib.load(f'{filepath_prefix}_features.pkl')
        self.ensemble_model = self.models.get('Ensemble')
        print(f"Models loaded successfully from prefix: {filepath_prefix}")

