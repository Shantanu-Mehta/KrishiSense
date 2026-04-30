import csv
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler

encoders = {}
X = []
y_reg = []
y_clf = []

with open('fulldata.csv', 'r') as f:
    reader = csv.DictReader(f)
    crops, soils, regions = [], [], []
    for row in reader:
        crops.append(row['crop_type'])
        soils.append(row['soil_type'])
        regions.append(row['region'])

crop_le = LabelEncoder().fit(crops)
soil_le = LabelEncoder().fit(soils)
region_le = LabelEncoder().fit(regions)

encoders['crop_type'] = crop_le
encoders['soil_type'] = soil_le
encoders['region'] = region_le

with open('fulldata.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        feat = [
            crop_le.transform([row['crop_type']])[0],
            soil_le.transform([row['soil_type']])[0],
            float(row['soil_moisture_%']),
            float(row['soil_pH']),
            float(row['temperature_C']),
            float(row['rainfall_mm']),
            float(row['humidity_%']),
            float(row['NDVI_index']),
            region_le.transform([row['region']])[0]
        ]
        X.append(feat)
        irr_amt = float(row['recommended_irrigation_mm'])
        y_reg.append(irr_amt)
        y_clf.append(1 if irr_amt > 0 else 0)

X = np.array(X)
y_reg = np.array(y_reg)
y_clf = np.array(y_clf)

scaler = StandardScaler().fit(X)
X_scaled = scaler.transform(X)

clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42).fit(X_scaled, y_clf)
reg = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42).fit(X_scaled, y_reg)

with open('encoders.pkl', 'wb') as f:
    pickle.dump(encoders, f)

with open('features.pkl', 'wb') as f:
    pickle.dump(scaler, f)

with open('clf_model.pkl', 'wb') as f:
    pickle.dump(clf, f)

with open('reg_model.pkl', 'wb') as f:
    pickle.dump(reg, f)

print("Training complete!")
