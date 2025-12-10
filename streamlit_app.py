
import streamlit as st
import pydeck as pdk
import math
import time
import random
from datetime import datetime, timedelta
from geopy.distance import geodesic
import pandas as pd
import numpy as np

# Page Config
st.set_page_config(
    page_title="FamilyGuardian AI",
    page_icon="🛡️",
    layout="wide",
)

# Constants & Types
DEFAULT_HOME = (25.0330, 121.5654) # Taipei 101 approx

# Initialize Session State
if 'person' not in st.session_state:
    st.session_state.person = {
        'name': 'Grandma Lin',
        'current_loc': DEFAULT_HOME,
        'home_loc': DEFAULT_HOME,
        'status': 'safe',
        'risk_score': 10,
        'history': [DEFAULT_HOME],
        'total_distance_walked': 0.0,
        'heart_rate': 75, # Normal resting rate
        'stress_level': 0.1, # 0-1
    }

if 'sim_time' not in st.session_state:
    st.session_state.sim_time = datetime.now().replace(hour=14, minute=0, second=0)

if 'notifications' not in st.session_state:
    st.session_state.notifications = []

if 'is_running' not in st.session_state:
    st.session_state.is_running = False

# Utility Functions
def calculate_distance(loc1, loc2):
    return geodesic(loc1, loc2).km

def calculate_bearing(lat1, lon1, lat2, lon2):
    startPathLat = math.radians(lat1)
    startPathLon = math.radians(lon1)
    endPathLat = math.radians(lat2)
    endPathLon = math.radians(lon2)
    dLon = endPathLon - startPathLon
    y = math.sin(dLon) * math.cos(endPathLat)
    x = math.cos(startPathLat) * math.sin(endPathLat) - \
        math.sin(startPathLat) * math.cos(endPathLat) * math.cos(dLon)
    brng = math.degrees(math.atan2(y, x))
    return (brng + 360) % 360

# --- AI MODEL SIMULATION ---
def ai_predict_risk(person, current_time, safe_dist_km):
    """
    Simulates a Multi-modal AI Model (LSTM + Random Forest)
    Inputs: Geo-Sequence (History), Temporal (Time), Physiological (Heart Rate)
    """
    factors = []
    base_score = 0
    
    # Feature 1: LSTM Sequence Anomaly (Simulated)
    # Checks tortuosity (efficiency) of movement
    dist_home = calculate_distance(person['current_loc'], person['home_loc'])
    
    if len(person['history']) > 5:
        recent_path = person['history'][-10:]
        path_length = sum([calculate_distance(recent_path[i], recent_path[i+1]) for i in range(len(recent_path)-1)])
        displacement = calculate_distance(recent_path[0], recent_path[-1])
        
        if path_length > 0.1:
            efficiency = displacement / path_length
            if efficiency < 0.4:
                base_score += 35
                factors.append("Anomaly: Erratic Path (LSTM Detected)")
            elif efficiency < 0.7:
                base_score += 15
                
    # Feature 2: Spatial Geofencing
    spatial_risk = min(100, (dist_home / safe_dist_km) * 40)
    base_score += spatial_risk
    
    # Feature 3: Temporal Context (Sundowning)
    hour = current_time.hour
    is_night = hour >= 18 or hour < 6
    if is_night:
        base_score += 15
        if dist_home > 0.2: # If outside at night
             base_score += 15
             factors.append("High Risk Context: Night Wandering")

    # Feature 4: Physiological Stress (Heart Rate Analysis)
    # High HR + Movement often indicates confusion/panic
    hr = person['heart_rate']
    # Use dynamic threshold if available, otherwise default to 100
    max_hr = st.session_state.get('max_hr_threshold', 100)
    
    if hr > max_hr:
        base_score += 25
        factors.append(f"Physiological Alert: High HR ({int(hr)} bpm > {max_hr})")
    elif hr > (max_hr - 10):
        base_score += 10
        
    final_score = max(0, min(100, base_score))
    return final_score, factors

def simulate_step(speed, safe_dist_km, wandering_mode=False):
    person = st.session_state.person
    
    # 1. Update Time
    st.session_state.sim_time += timedelta(minutes=5 * speed)
    
    # 2. Simulate Movement
    move_dist = 0.0005 * speed
    current_lat, current_lng = person['current_loc']
    
    if wandering_mode:
        # Wandering behavior
        angle = random.uniform(0, 2 * math.pi)
        move_dist *= 0.8
        # Wandering induces stress
        person['stress_level'] = min(1.0, person['stress_level'] + 0.1)
    else:
        # Normal behavior
        if len(person['history']) > 1:
             prev = person['history'][-2]
             prev_bearing = calculate_bearing(prev[0], prev[1], current_lat, current_lng)
             angle_deg = prev_bearing + random.uniform(-45, 45)
             angle = math.radians(angle_deg)
             # Walking reduces stress usually, unless lost
             person['stress_level'] = max(0, person['stress_level'] - 0.05)
        else:
             angle = random.uniform(0, 2 * math.pi)

    new_lat = current_lat + math.sin(angle) * move_dist
    new_lng = current_lng + math.cos(angle) * move_dist
    new_loc = (new_lat, new_lng)
    
    # 3. Simulate Biometrics (Heart Rate)
    # Base HR 70-80. Stress adds up to 40. Activity adds up to 20.
    base_hr = 70 + (random.random() * 10)
    activity_hr = 20 * speed # simplistic
    stress_hr = person['stress_level'] * 40
    person['heart_rate'] = base_hr + activity_hr + stress_hr
    
    # Update State
    person['history'].append(new_loc)
    if len(person['history']) > 200:
        person['history'].pop(0)
    person['current_loc'] = new_loc
    
    # 4. AI Prediction
    risk, risk_factors = ai_predict_risk(person, st.session_state.sim_time, safe_dist_km)
    person['risk_score'] = risk
    person['risk_factors'] = risk_factors
    
    # Status Update
    prev_status = person['status']
    if risk > 85:
        person['status'] = 'danger'
    elif risk > 50:
        person['status'] = 'warning'
    else:
        person['status'] = 'safe'
        
    # Notifications
    time_str = st.session_state.sim_time.strftime("%H:%M")
    if person['status'] != prev_status:
        if person['status'] == 'warning':
            msg = f"Potential Risk: {', '.join(risk_factors)}" if risk_factors else "Subject moving away from safe zone."
            st.session_state.notifications.insert(0, {'time': time_str, 'msg': msg, 'type': 'warning'})
        elif person['status'] == 'danger':
            msg = f"CRITICAL: {', '.join(risk_factors)}" if risk_factors else "High risk detected!"
            st.session_state.notifications.insert(0, {'time': time_str, 'msg': msg, 'type': 'danger'})

# UI Layout
st.title("🛡️ FamilyGuardian AI - Advanced Prediction")

# Top Metrics Row
col1, col2, col3, col4 = st.columns(4)

with col1:
    status_color = "green" if st.session_state.person['status'] == 'safe' else "orange" if st.session_state.person['status'] == 'warning' else "red"
    st.markdown(f"### Status")
    st.markdown(f"<h2 style='color: {status_color}; margin:0;'>{st.session_state.person['status'].upper()}</h2>", unsafe_allow_html=True)

with col2:
    st.metric("AI Risk Score", f"{int(st.session_state.person['risk_score'])}/100", 
              delta=f"{int(st.session_state.person['risk_score']) - 10} vs base", delta_color="inverse")

with col3:
    hr = int(st.session_state.person['heart_rate'])
    st.metric("Heart Rate (BPM)", f"❤️ {hr}", delta=f"{hr-75} bpm", delta_color="inverse")

with col4:
    sim_time_display = st.session_state.sim_time.strftime("%I:%M %p")
    is_night = st.session_state.sim_time.hour >= 18 or st.session_state.sim_time.hour < 6
    icon = "🌙" if is_night else "☀️"
    st.metric("Simulation Time", f"{icon} {sim_time_display}")

# Sidebar Settings
with st.sidebar:
    st.header("⚙️ Configuration")
    safe_distance = st.slider("Safe Distance (km)", 0.1, 5.0, 0.5)
    simulation_speed = st.slider("Simulation Speed", 1.0, 5.0, 1.0)
    
    st.markdown("### ❤️ Biometrics")
    st.session_state.max_hr_threshold = st.slider("Max Heart Rate Threshold", 80, 150, 100, help="Trigger alert if HR exceeds this value")
    
    st.divider()
    
    st.header("🎮 Controls")
    col_ctrl1, col_ctrl2 = st.columns(2)
    with col_ctrl1:
        if not st.session_state.is_running:
            if st.button("▶️ Start", type="primary"):
                st.session_state.is_running = True
                st.rerun()
        else:
            if st.button("⏸️ Pause"):
                st.session_state.is_running = False
                st.rerun()
    
    st.divider()
    
    st.subheader("Event Simulation")
    
    # 1. Wandering Mode
    if st.button("😵 Simulate Panic Wandering"):
         # Trigger random steps immediately
         st.session_state.person['stress_level'] = 0.8 # Induce stress
         for _ in range(5):
             simulate_step(simulation_speed, safe_distance, wandering_mode=True)
         st.rerun()

    if st.button(" Reset Home"):
        st.session_state.person['current_loc'] = DEFAULT_HOME
        st.session_state.person['history'] = [DEFAULT_HOME]
        st.session_state.person['risk_score'] = 10
        st.session_state.person['status'] = 'safe'
        st.session_state.person['heart_rate'] = 75
        st.session_state.person['stress_level'] = 0.1
        st.session_state.sim_time = datetime.now().replace(hour=14, minute=0)
        st.session_state.notifications = []
        st.rerun()

# Main Content: Map & AI Viz
row2_col1, row2_col2 = st.columns([2, 1])

with row2_col1:
    # Preapre Data for Pydeck (Same as before)
    current_lat, current_lng = st.session_state.person['current_loc']
    home_lat, home_lng = st.session_state.person['home_loc']
    status = st.session_state.person['status']
    
    person_df = pd.DataFrame([{
        "lat": current_lat, "lng": current_lng, "name": st.session_state.person['name'],
        "status": status,
        "color": [239, 68, 68, 200] if status == 'danger' else [245, 158, 11, 200] if status == 'warning' else [16, 185, 129, 200]
    }])
    home_df = pd.DataFrame([{"lat": home_lat, "lng": home_lng, "type": "Home"}])
    path_coordinates = [[p[1], p[0]] for p in st.session_state.person['history']]
    path_data = pd.DataFrame([{"path": path_coordinates, "color": [100, 100, 100, 150]}])
    
    home_zone_layer = pdk.Layer("ScatterplotLayer", data=home_df, get_position=["lng", "lat"], get_fill_color=[59, 130, 246, 30], get_line_color=[59, 130, 246, 150], stroked=True, filled=True, line_width_min_pixels=1, get_radius=safe_distance * 1000)
    home_point_layer = pdk.Layer("ScatterplotLayer", data=home_df, get_position=["lng", "lat"], get_fill_color=[59, 130, 246, 255], radius_min_pixels=5, pickable=True)
    person_layer = pdk.Layer("ScatterplotLayer", data=person_df, get_position=["lng", "lat"], get_fill_color="color", get_line_color=[255, 255, 255], stroked=True, filled=True, radius_min_pixels=8, pickable=True)
    path_layer = pdk.Layer("PathLayer", data=path_data, pickable=True, get_color="color", width_scale=20, width_min_pixels=2, get_path="path", get_width=5)
    
    view_state = pdk.ViewState(latitude=current_lat, longitude=current_lng, zoom=15, pitch=0)
    r = pdk.Deck(map_provider="carto", map_style="light", layers=[home_zone_layer, home_point_layer, path_layer, person_layer], initial_view_state=view_state, tooltip={"text": "{name}\n{status}"})
    st.pydeck_chart(r)

with row2_col2:
    st.subheader("🧠 Multi-modal AI Prediction")
    
    # Neural Network style simple viz
    st.markdown("""
    <div style="background-color: #262730; padding: 15px; border-radius: 10px; color: white;">
        <h4 style="margin:0">Biometric LSTM Model</h4>
        <p style="font-size: 12px; color: #aaa;">Inference Running...</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Factors
    if 'risk_factors' in st.session_state.person and st.session_state.person['risk_factors']:
         for factor in st.session_state.person['risk_factors']:
             st.caption(f"🔴 {factor}")
    else:
         st.caption("✅ No Anomalies Detected")

    # Metrics bars
    st.markdown("---")
    st.write("**Model Inputs:**")
    
    hr_norm = min(1.0, max(0.0, (st.session_state.person['heart_rate'] - 60) / 100))
    st.progress(hr_norm, text="Physiological Stress (Heart Rate)")
    
    tortuosity = 0.5 # placeholder visualization
    if len(st.session_state.person['history']) > 10:
        # Simple tortuosity calc for viz
        recent = st.session_state.person['history'][-10:]
        disp = calculate_distance(recent[0], recent[-1])
        length = sum([calculate_distance(recent[i], recent[i+1]) for i in range(len(recent)-1)])
        if length > 0: tortuosity = 1.0 - (disp/length) 
        
    st.progress(min(1.0, tortuosity*2), text="Trajectory Tortuosity (Wandering)")

    st.markdown("---")
    st.subheader("🔔 Alerts")
    if not st.session_state.notifications:
        st.caption("No active alerts.")
    else:
        for notif in st.session_state.notifications[:5]:
            icon = "🔴" if notif['type'] == 'danger' else "🟠"
            st.write(f"{icon} **{notif['time']}**: {notif['msg']}")

# Auto-refresh loop
if st.session_state.is_running:
    simulate_step(simulation_speed, safe_distance)
    time.sleep(1)
    st.rerun()
