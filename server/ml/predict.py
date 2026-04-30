import sys
import json
import pickle
import numpy as np
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent.absolute() 

# Get input data from command line arguments
input_data = json.loads(sys.argv[1])

try:
    # Load pre-trained models
    with open(script_dir / 'clf_model.pkl', 'rb') as f:
        clf_model = pickle.load(f)
    
    with open(script_dir / 'reg_model.pkl', 'rb') as f:
        reg_model = pickle.load(f)
    
    with open(script_dir / 'encoders.pkl', 'rb') as f:
        encoders = pickle.load(f)
    
    with open(script_dir / 'features.pkl', 'rb') as f:
        feature_scaler = pickle.load(f)
    
    # Unify feature extraction to handle both ESP32 and Web App inputs seamlessly
    features = {
        'crop_type': input_data.get('crop', input_data.get('crop_type', 'wheat')),
        'soil_type': input_data.get('soilType', input_data.get('soil_type', 'loamy')),
        'soil_moisture_%': float(input_data.get('soilMoisture', input_data.get('soil_moisture', input_data.get('soil_moisture_%', 50)))),
        'soil_pH': float(input_data.get('ph', input_data.get('soil_pH', 7.0))),
        'temperature_C': float(input_data.get('temperature', input_data.get('temperature_C', 25))),
        'rainfall_mm': float(input_data.get('rainfall', input_data.get('rainfall_mm', 0))),
        'humidity_%': float(input_data.get('humidity', input_data.get('humidity_%', 65))),
        'NDVI_index': float(input_data.get('NDVI_index', 0.5)),
        'region': input_data.get('location', input_data.get('region', 'North India'))
    }
    
    # Encode categorical features
    encoded_features = []
    
    # Encode crop_type
    if 'crop_type' in encoders:
        try:
            crop_encoded = encoders['crop_type'].transform([features['crop_type']])[0]
        except:
            crop_encoded = 0
    else:
        crop_encoded = 0
    encoded_features.append(crop_encoded)
    
    # Encode soil_type
    if 'soil_type' in encoders:
        try:
            soil_encoded = encoders['soil_type'].transform([features['soil_type']])[0]
        except:
            soil_encoded = 0
    else:
        soil_encoded = 0
    encoded_features.append(soil_encoded)
    
    # Add numerical features in order
    encoded_features.extend([
        features['soil_moisture_%'],
        features['soil_pH'],
        features['temperature_C'],
        features['rainfall_mm'],
        features['humidity_%'],
        features['NDVI_index']
    ])
    
    # Encode region
    if 'region' in encoders:
        try:
            region_encoded = encoders['region'].transform([features['region']])[0]
        except:
            region_encoded = 0
    else:
        region_encoded = 0
    encoded_features.append(region_encoded)
    
    # Simulate 7 days
    base_moisture = features['soil_moisture_%']
    base_temp = features['temperature_C']
    
    schedule = []
    current_moisture = base_moisture
    
    for day in range(7):
        # Update features array with current moisture (index 2 is soil_moisture_%)
        encoded_features[2] = current_moisture
        
        # Convert to numpy array
        X = np.array(encoded_features).reshape(1, -1)
        
        # Scale features
        try:
            X_scaled = feature_scaler.transform(X)
        except:
            X_scaled = X
            
        classification_result = clf_model.predict(X_scaled)[0]
        regression_result = reg_model.predict(X_scaled)[0]
        
        should_irrigate = bool(classification_result > 0.5)
        water_amount = float(regression_result) if should_irrigate else 0.0
        
        schedule.append({
            "day": day + 1,
            "should_irrigate": should_irrigate,
            "water_amount": water_amount,
            "simulated_moisture": float(current_moisture)
        })
        
        # Simulate moisture change for the next day
        if should_irrigate:
            current_moisture = min(100.0, current_moisture + 40.0)
        else:
            drop = 5.0 + (base_temp / 10.0)
            current_moisture = max(0.0, current_moisture - drop)

    classification_result_day1 = schedule[0]["should_irrigate"]
    regression_result_day1 = schedule[0]["water_amount"]

    # For ESP32, return simple format, otherwise return detailed format
    if 'device_id' in input_data:
        output = {
            "should_irrigate": classification_result_day1,
            "water_amount": regression_result_day1,
            "schedule": schedule
        }
    else:
        # Re-run day 1 for full predictions object compatibility
        encoded_features[2] = base_moisture
        X = np.array(encoded_features).reshape(1, -1)
        try:
            X_scaled = feature_scaler.transform(X)
        except:
            X_scaled = X
        
        classification_proba = clf_model.predict_proba(X_scaled)[0] if hasattr(clf_model, 'predict_proba') else [0, 0.85]
        confidence = float(max(classification_proba))
        
        output = {
            'success': True,
            'should_irrigate': classification_result_day1,
            'water_amount': regression_result_day1,
            'schedule': schedule,
            'predictions': {
                'irrigationNeeded': int(classification_result_day1),
                'irrigationAmount': regression_result_day1,
                'recommended_irrigation_mm': regression_result_day1 if classification_result_day1 else 100,
                'confidence': float(confidence),
                'classification': {
                    'result': int(classification_result_day1),
                    'label': 'Irrigation Required' if classification_result_day1 else 'No Irrigation'
                },
                'regression': {
                    'recommended_irrigation_mm': regression_result_day1
                }
            }
        }
    
    print(json.dumps(output))

except Exception as e:
    if 'device_id' in input_data:
        output = {
            "should_irrigate": False,
            "water_amount": 0,
            "error": str(e)
        }
    else:
        output = {
            "success": False,
            "error": str(e)
        }
    print(json.dumps(output))
    sys.exit(1)