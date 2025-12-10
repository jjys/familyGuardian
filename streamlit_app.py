
import streamlit as st
import folium
from streamlit_folium import st_folium
import math
import time
import random
from datetime import datetime
from geopy.distance import geodesic

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
        'history': [DEFAULT_HOME]
    }

if 'notifications' not in st.session_state:
    st.session_state.notifications = []

if 'is_running' not in st.session_state:
    st.session_state.is_running = False

# Utility Functions
def calculate_distance(loc1, loc2):
    return geodesic(loc1, loc2).km

def update_risk_score(current_loc, home_loc, history, safe_dist_km):
    dist = calculate_distance(current_loc, home_loc)
    
    # Base risk
    score = min(100, (dist / safe_dist_km) * 50)
    
    # Trend
    if len(history) > 2:
        prev_dist = calculate_distance(history[-2], home_loc)
        # If moving away
        if dist > prev_dist:
            score += 10
        else:
            score -= 5
            
    return max(0, min(100, score))

def simulate_step(speed, safe_dist_km):
    person = st.session_state.person
    
    # Random walk
    move_dist = 0.0005 * speed
    angle = random.uniform(0, 2 * math.pi)
    
    new_lat = person['current_loc'][0] + math.sin(angle) * move_dist
    new_lng = person['current_loc'][1] + math.cos(angle) * move_dist
    new_loc = (new_lat, new_lng)
    
    person['history'].append(new_loc)
    if len(person['history']) > 50:
        person['history'].pop(0)
        
    risk = update_risk_score(new_loc, person['home_loc'], person['history'], safe_dist_km)
    
    person['current_loc'] = new_loc
    person['risk_score'] = risk
    
    prev_status = person['status']
    if risk > 85:
        person['status'] = 'danger'
    elif risk > 50:
        person['status'] = 'warning'
    else:
        person['status'] = 'safe'
        
    # Notifications
    if person['status'] != prev_status:
        if person['status'] == 'warning':
            st.session_state.notifications.insert(0, {
                'time': datetime.now().strftime("%H:%M:%S"),
                'msg': "Potential Risk Detected: Subject moving away from safe zone.",
                'type': 'warning'
            })
        elif person['status'] == 'danger':
            st.session_state.notifications.insert(0, {
                'time': datetime.now().strftime("%H:%M:%S"),
                'msg': "CRITICAL ALERT: High risk of getting lost!",
                'type': 'danger'
            })

# UI Layout
st.title("🛡️ FamilyGuardian AI - Monitoring Dashboard")

# Top Metrics Row
col1, col2, col3, col4 = st.columns(4)

with col1:
    status_color = "green" if st.session_state.person['status'] == 'safe' else "orange" if st.session_state.person['status'] == 'warning' else "red"
    st.markdown(f"### Status")
    st.markdown(f"<h2 style='color: {status_color};'>{st.session_state.person['status'].upper()}</h2>", unsafe_allow_html=True)

with col2:
    st.metric("Risk Score", f"{int(st.session_state.person['risk_score'])}/100", 
              delta=f"{int(st.session_state.person['risk_score']) - 10} vs base", delta_color="inverse")

with col3:
    dist = calculate_distance(st.session_state.person['current_loc'], st.session_state.person['home_loc'])
    st.metric("Distance from Home", f"{dist:.3f} km")

with col4:
    st.metric("Last Update", datetime.now().strftime("%H:%M:%S"))

# Sidebar Settings
with st.sidebar:
    st.header("⚙️ Configuration")
    safe_distance = st.slider("Safe Distance (km)", 0.1, 5.0, 0.5)
    simulation_speed = st.slider("Simulation Speed", 1.0, 5.0, 1.0)
    
    st.divider()
    
    st.header("🎮 Controls")
    col_ctrl1, col_ctrl2 = st.columns(2)
    with col_ctrl1:
        start_btn = st.button("Start/Resume", type="primary")
    with col_ctrl2:
        stop_btn = st.button("Pause")
        
    if start_btn:
        st.session_state.is_running = True
    if stop_btn:
        st.session_state.is_running = False
        
    st.divider()
    
    st.subheader("Simulate Events")
    if st.button("⚠️ Simulate Wandering"):
        # Force move away
        lat, lng = st.session_state.person['current_loc']
        st.session_state.person['current_loc'] = (lat + 0.01, lng + 0.01)
        st.session_state.person['risk_score'] = 90
        st.session_state.person['status'] = 'danger'
        st.session_state.notifications.insert(0, {
            'time': datetime.now().strftime("%H:%M:%S"),
            'msg': "Manual Simulation: Subject wandered far away!",
            'type': 'danger'
        })
        st.rerun()
        
    if st.button("🏠 Reset Home"):
        st.session_state.person['current_loc'] = DEFAULT_HOME
        st.session_state.person['history'] = [DEFAULT_HOME]
        st.session_state.person['risk_score'] = 10
        st.session_state.person['status'] = 'safe'
        st.session_state.notifications = []
        st.rerun()

# Main Content: Map & Notifications
row2_col1, row2_col2 = st.columns([2, 1])

with row2_col1:
    st.subheader("📍 Live Tracking")
    
    # Create map
    m = folium.Map(location=st.session_state.person['current_loc'], zoom_start=15)
    
    # Home marker
    folium.Circle(
        location=st.session_state.person['home_loc'],
        radius=safe_distance * 1000,
        color="blue",
        fill=True,
        fill_opacity=0.1
    ).add_to(m)
    
    folium.Marker(
        st.session_state.person['home_loc'], 
        tooltip="Home",
        icon=folium.Icon(color="blue", icon="home")
    ).add_to(m)
    
    # Person marker
    person_color = "green" if st.session_state.person['status'] == 'safe' else "orange" if st.session_state.person['status'] == 'warning' else "red"
    
    folium.CircleMarker(
        location=st.session_state.person['current_loc'],
        radius=10,
        color=person_color,
        fill=True,
        fill_opacity=0.8,
        tooltip=f"{st.session_state.person['name']} (Risk: {int(st.session_state.person['risk_score'])})"
    ).add_to(m)
    
    # History path
    if len(st.session_state.person['history']) > 1:
        folium.PolyLine(
            st.session_state.person['history'],
            color="gray",
            weight=2,
            opacity=0.5
        ).add_to(m)

    st_folium(m, width="100%", height=500, key=f"map_{datetime.now().timestamp()}") # Force refresh with key

with row2_col2:
    st.subheader("🔔 Notifications")
    if not st.session_state.notifications:
        st.info("No new notifications")
    else:
        for notif in st.session_state.notifications[:10]:
            if notif['type'] == 'danger':
                st.error(f"**[{notif['time']}]** {notif['msg']}")
            elif notif['type'] == 'warning':
                st.warning(f"**[{notif['time']}]** {notif['msg']}")
            else:
                st.write(f"**[{notif['time']}]** {notif['msg']}")

# Auto-refresh loop
if st.session_state.is_running:
    simulate_step(simulation_speed, safe_distance)
    time.sleep(1) # Refresh rate
    st.rerun()

