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
    
    def prepare_features(self, df):
        """Prepare features for training"""
        # Encode categorical variables
        df_processed = df.copy()
        
        # Encode current posture
        df_processed['current_posture_encoded'] = self.posture_encoder.fit_transform(df_processed['current_posture'])
        
        # Select features for training
        feature_columns = [
            'heart_rate', 'spo2', 'temperature',
            'current_posture_encoded',
            'left_posture_pct', 'right_posture_pct', 'supine_posture_pct',
            'hr_spo2_ratio', 'temp_deviation', 'posture_mobility_score',
            'vital_stability_score'
        ]
        
        X = df_processed[feature_columns]
        y = df_processed['dependability']
        
        self.feature_names = feature_columns
        return X, y
    
    def train_models(self, X_train, y_train):
        """Train all classification models"""
        
        # Define models with hyperparameters
        model_configs = {
            'Logistic Regression': LogisticRegression(
                random_state=42, max_iter=1000, C=1.0
            ),
            'Decision Tree': DecisionTreeClassifier(
                random_state=42, max_depth=10, min_samples_split=20
            ),
            'KNN': KNeighborsClassifier(
                n_neighbors=7, weights='distance'
            ),
            'SVM': SVC(
                random_state=42, C=1.0, kernel='rbf', probability=True
            ),
            'Random Forest': RandomForestClassifier(
                random_state=42, n_estimators=100, max_depth=15
            )
        }
        
        # Train individual models
        for name, model in model_configs.items():
            print(f"Training {name}...")
            model.fit(X_train, y_train)
            self.models[name] = model
        
        # Create ensemble model
        ensemble_models = [
            ('dt', self.models['Decision Tree']),
            ('rf', self.models['Random Forest']),
            ('svm', self.models['SVM'])
        ]
        
        self.ensemble_model = VotingClassifier(
            estimators=ensemble_models,
            voting='soft'
        )
        
        print("Training Ensemble Model...")
        self.ensemble_model.fit(X_train, y_train)
        self.models['Ensemble'] = self.ensemble_model
        
        print("All models trained successfully!")
    
    def evaluate_models(self, X_test, y_test):
        """Evaluate all models and return results"""
        results = {}
        
        print("="*60)
        print("MODEL EVALUATION RESULTS")
        print("="*60)
        
        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            results[name] = {
                'accuracy': accuracy,
                'predictions': y_pred,
                'classification_report': classification_report(y_test, y_pred)
            }
            
            print(f"\n{name.upper()} RESULTS:")
            print(f"Accuracy: {accuracy:.4f}")
            print("Classification Report:")
            print(results[name]['classification_report'])
            print("-" * 50)
        
        return results
    
    def plot_confusion_matrices(self, y_test, results):
        """Plot confusion matrices for all models"""
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        axes = axes.ravel()
        
        for idx, (name, result) in enumerate(results.items()):
            if idx < len(axes):
                cm = confusion_matrix(y_test, result['predictions'])
                sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                           xticklabels=['High', 'Low', 'Moderate'],
                           yticklabels=['High', 'Low', 'Moderate'],
                           ax=axes[idx])
                axes[idx].set_title(f'{name} - Confusion Matrix')
                axes[idx].set_xlabel('Predicted')
                axes[idx].set_ylabel('Actual')
        
        # Hide unused subplot
        if len(results) < len(axes):
            axes[-1].axis('off')
        
        plt.tight_layout()
        plt.savefig('confusion_matrices.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def plot_feature_importance(self):
        """Plot feature importance for tree-based models"""
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # Decision Tree
        dt_importance = self.models['Decision Tree'].feature_importances_
        axes[0].barh(range(len(self.feature_names)), dt_importance)
        axes[0].set_yticks(range(len(self.feature_names)))
        axes[0].set_yticklabels(self.feature_names)
        axes[0].set_title('Decision Tree - Feature Importance')
        axes[0].set_xlabel('Importance')
        
        # Random Forest
        rf_importance = self.models['Random Forest'].feature_importances_
        axes[1].barh(range(len(self.feature_names)), rf_importance)
        axes[1].set_yticks(range(len(self.feature_names)))
        axes[1].set_yticklabels(self.feature_names)
        axes[1].set_title('Random Forest - Feature Importance')
        axes[1].set_xlabel('Importance')
        
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
        plt.show()
    
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
    
    def save_models(self, filepath_prefix='patient_dependability_model'):
        """Save trained models and preprocessors"""
        joblib.dump(self.models, f'{filepath_prefix}_models.pkl')
        joblib.dump(self.scaler, f'{filepath_prefix}_scaler.pkl')
        joblib.dump(self.posture_encoder, f'{filepath_prefix}_posture_encoder.pkl')
        joblib.dump(self.feature_names, f'{filepath_prefix}_features.pkl')
        print(f"Models saved successfully with prefix: {filepath_prefix}")
    
    def load_models(self, filepath_prefix='patient_dependability_model'):
        """Load trained models and preprocessors"""
        self.models = joblib.load(f'{filepath_prefix}_models.pkl')
        self.scaler = joblib.load(f'{filepath_prefix}_scaler.pkl')
        self.posture_encoder = joblib.load(f'{filepath_prefix}_posture_encoder.pkl')
        self.feature_names = joblib.load(f'{filepath_prefix}_features.pkl')
        self.ensemble_model = self.models.get('Ensemble')
        print(f"Models loaded successfully from prefix: {filepath_prefix}")

def main():
    """Main function to demonstrate the complete workflow"""
    
    print("🏥 Patient Dependability Classification System")
    print("=" * 60)
    
    # Initialize classifier
    classifier = PatientDependabilityClassifier()
    
    # Generate dataset
    print("📊 Generating patient dataset...")
    df = classifier.generate_dataset(n_samples=2000)
    
    # Save dataset
    df.to_csv('patient_data.csv', index=False)
    print(f"Dataset saved as 'patient_data.csv' with {len(df)} samples")
    
    # Display dataset info
    print(f"\nDataset Overview:")
    print(f"Shape: {df.shape}")
    print(f"\nDependability Distribution:")
    print(df['dependability'].value_counts())
    print(f"\nPosture Distribution:")
    print(df['current_posture'].value_counts())
    
    # Prepare features
    print("\n🔧 Preparing features...")
    X, y = classifier.prepare_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    X_train_scaled = classifier.scaler.fit_transform(X_train)
    X_test_scaled = classifier.scaler.transform(X_test)
    
    # Train models
    print("\n🤖 Training machine learning models...")
    classifier.train_models(X_train_scaled, y_train)
    
    # Evaluate models
    print("\n📈 Evaluating models...")
    results = classifier.evaluate_models(X_test_scaled, y_test)
    
    # Plot results
    print("\n📊 Generating visualizations...")
    classifier.plot_confusion_matrices(y_test, results)
    classifier.plot_feature_importance()
    
    # Save models
    classifier.save_models()
    
    # Demonstration of prediction
    print("\n🔮 PREDICTION DEMONSTRATION:")
    print("-" * 40)
    
    # Example predictions
    test_cases = [
        {
            'heart_rate': 75, 'spo2': 98, 'temperature': 36.8,
            'current_posture': 'Right', 'left_pct': 35, 'right_pct': 35, 'supine_pct': 30,
            'expected': 'Low'
        },
        {
            'heart_rate': 85, 'spo2': 93, 'temperature': 37.2,
            'current_posture': 'Supine', 'left_pct': 25, 'right_pct': 25, 'supine_pct': 50,
            'expected': 'Moderate'
        },
        {
            'heart_rate': 95, 'spo2': 88, 'temperature': 37.8,
            'current_posture': 'Supine', 'left_pct': 10, 'right_pct': 15, 'supine_pct': 75,
            'expected': 'High'
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        prediction, probabilities = classifier.predict_dependability(
            case['heart_rate'], case['spo2'], case['temperature'],
            case['current_posture'], case['left_pct'], case['right_pct'], case['supine_pct']
        )
        
        print(f"\nTest Case {i}:")
        print(f"  Input: HR={case['heart_rate']}, SpO2={case['spo2']}%, Temp={case['temperature']}°C")
        print(f"         Posture={case['current_posture']}, Distribution: L={case['left_pct']}%, R={case['right_pct']}%, S={case['supine_pct']}%")
        print(f"  Predicted: {prediction} (Expected: {case['expected']})")
        print(f"  Probabilities: {', '.join([f'{k}: {v:.2f}' for k, v in probabilities.items()])}")
    
    print(f"\n✅ Training completed successfully!")
    print(f"📁 Files generated:")
    print(f"   - patient_data.csv (dataset)")
    print(f"   - patient_dependability_model_*.pkl (trained models)")
    print(f"   - confusion_matrices.png (evaluation plots)")
    print(f"   - feature_importance.png (feature analysis)")

if __name__ == "__main__":
    main()