import sys
import json
import pickle
import numpy as np
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent.absolute() 

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
    
    # Get input data from command line arguments
    input_data = json.loads(sys.argv[1])
    
    # Check if this is ESP32 sensor data or crop data
    if 'device_id' in input_data:
        # ESP32 sensor data format
        features = {
            'crop_type': input_data.get('crop_type', 'wheat'),
            'soil_type': 'loamy',  # default
            'soil_moisture_%': float(input_data.get('soil_moisture', 50)),
            'soil_pH': float(input_data.get('ph', 7.0)),
            'temperature_C': float(input_data.get('temperature', 25)),
            'rainfall_mm': float(input_data.get('rainfall', 0)),
            'humidity_%': float(input_data.get('humidity', 65)),
            'NDVI_index': 0.5,  # default
            'region': 'North India'  # default
        }
        
        # Log additional fields if present
        if 'water_level' in input_data:
            print(f"Warning: water_level {input_data['water_level']} not used in prediction", file=sys.stderr)
    else:
        # Original crop data format
        features = {
            'crop_type': input_data.get('crop_type', 'rice'),
            'soil_type': input_data.get('soil_type', 'loamy'),
            'soil_moisture_%': float(input_data.get('soil_moisture_%', 50)),
            'soil_pH': float(input_data.get('soil_pH', 7.0)),
            'temperature_C': float(input_data.get('temperature_C', 25)),
            'rainfall_mm': float(input_data.get('rainfall_mm', 100)),
            'humidity_%': float(input_data.get('humidity_%', 65)),
            'NDVI_index': float(input_data.get('NDVI_index', 0.5)),
            'region': input_data.get('region', 'North India')
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
    
    # Convert to numpy array
    X = np.array(encoded_features).reshape(1, -1)
    
    # Scale features
    try:
        X_scaled = feature_scaler.transform(X)
    except:
        X_scaled = X
    
    # Make predictions
    classification_result = clf_model.predict(X_scaled)[0]
    regression_result = reg_model.predict(X_scaled)[0]
    
    # For ESP32, return simple format
    if 'device_id' in input_data:
        output = {
            "should_irrigate": bool(classification_result > 0.5),
            "water_amount": float(regression_result)
        }
    else:
        # Original format
        classification_proba = clf_model.predict_proba(X_scaled)[0]
        confidence = float(max(classification_proba)) if hasattr(clf_model, 'predict_proba') else 0.85
        
        output = {
            'success': True,
            'predictions': {
                'irrigationNeeded': int(classification_result),
                'irrigationAmount': float(regression_result),
                'recommended_irrigation_mm': float(regression_result) if regression_result > 0 else 100,
                'confidence': float(confidence),
                'classification': {
                    'result': int(classification_result),
                    'label': 'Irrigation Required' if classification_result > 0.5 else 'No Irrigation'
                },
                'regression': {
                    'recommended_irrigation_mm': float(regression_result)
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