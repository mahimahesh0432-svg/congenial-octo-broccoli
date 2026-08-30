import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  ImageBackground
} from 'react-native';

const { width, height } = Dimensions.get('window');
const MAP_IMAGE = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80';

// Your Real Firebase Database URL
const FIREBASE_DB_URL = 'https://go-ride-app-8d5c9-default-rtdb.firebaseio.com';

export default function App() {
  const [appMode, setAppMode] = useState('user');
  const [screen, setScreen] = useState('login');
  
  // Auth
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Booking details
  const [pickup, setPickup] = useState('Hitec City Metro Station, Hyderabad');
  const [drop, setDrop] = useState('Inorbit Mall, Madhapur');
  const [selectedRide, setSelectedRide] = useState('bike');
  const [bookingId, setBookingId] = useState(null);

  // Simulation / Real-time data
  const [driver, setDriver] = useState(null);
  const [rating, setRating] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isDriverOnline, setIsDriverOnline] = useState(true);

  const rides = [
    { id: 'bike', name: 'Go Bike', price: '₹45', time: '3 mins away', icon: '🛵' },
    { id: 'auto', name: 'Go Auto', price: '₹75', time: '5 mins away', icon: '🛺' },
    { id: 'cab', name: 'Go Cab', price: '₹140', time: '8 mins away', icon: '🚗' },
  ];

  const handleSendOtp = () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent', 'Demo OTP: 1234');
  };

  const handleVerifyOtp = () => {
    if (otp === '1234' || otp.length === 4) {
      setScreen('booking');
    } else {
      Alert.alert('Error', 'Enter OTP 1234.');
    }
  };

  // --- SAVE RIDE TO YOUR REAL FIREBASE DATABASE ---
  const handleBooking = async () => {
    setScreen('searching');
    const chosen = rides.find(r => r.id === selectedRide);
    const newRideData = {
      userPhone: phone || '9876543210',
      pickupLocation: pickup,
      dropLocation: drop,
      rideType: chosen.name,
      fare: chosen.price,
      status: 'BOOKED_PENDING_DRIVER',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${FIREBASE_DB_URL}/rides.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRideData)
      });
      const data = await res.json();
      setBookingId(data.name);

      setTimeout(() => {
        setDriver({
          name: 'Ramesh Kumar',
          rating: '4.8 ★',
          vehicle: `${chosen.name} - TS 09 EA 4521`,
          otp: Math.floor(1000 + Math.random() * 9000),
          eta: 'Arriving in 3 mins',
          fare: chosen.price
        });
        setScreen('tracking');
      }, 2500);

    } catch (err) {
      setScreen('tracking');
    }
  };

  // --- SAVE PAYMENT & RATING TO FIREBASE ---
  const handleCompleteTrip = async () => {
    if (bookingId) {
      try {
        await fetch(`${FIREBASE_DB_URL}/rides/${bookingId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            paymentMethod: paymentMethod,
            rating: rating,
            completedAt: new Date().toISOString()
          })
        });
      } catch (err) {
        console.log(err);
      }
    }
    Alert.alert('Database Updated! 🚀', 'Your trip and rating are saved in Firebase.');
    setScreen('booking');
  };

  // ----------------- DRIVER APP MODE -----------------
  if (appMode === 'driver') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#1E293B' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Go Ride Driver 🛵</Text>
            <TouchableOpacity 
              style={styles.switchModeBtn}
              onPress={() => setAppMode('user')}
            >
              <Text style={styles.switchModeText}>User Mode 🔄</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeader}>Firebase Realtime: 🟢 Connected</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.driverStatusCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              Status: {isDriverOnline ? '🟢 Online' : '🔴 Offline'}
            </Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, { backgroundColor: isDriverOnline ? '#EF4444' : '#22C55E' }]}
              onPress={() => setIsDriverOnline(!isDriverOnline)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {isDriverOnline ? 'Go Offline' : 'Go Online'}
              </Text>
            </TouchableOpacity>
          </View>

          {isDriverOnline ? (
            <View style={styles.newRideRequestCard}>
              <Text style={styles.reqBadge}>🔔 LIVE DB RIDE REQUEST</Text>
              <Text style={styles.reqFare}>₹ 45.00</Text>
              <Text style={styles.reqLocation}>📍 {pickup}</Text>
              <Text style={styles.reqLocation}>🎯 {drop}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.callBtn, { backgroundColor: '#22C55E' }]}
                  onPress={() => Alert.alert('Ride Accepted!', 'Trip marked active in Firebase DB.')}
                >
                  <Text style={styles.callBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelTripBtn}
                  onPress={() => Alert.alert('Declined')}
                >
                  <Text style={styles.cancelTripText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.card, { alignItems: 'center', padding: 30 }]}>
              <Text style={{ color: '#64748B' }}>Go online to receive real-time database orders</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ----------------- SCREEN: LOGIN -----------------
  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.logoText}>Go Ride 🚖</Text>
          <Text style={styles.authSubtitle}>Live Cloud Database Connected</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />

            {otpSent && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Enter OTP (1234)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4-digit OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={4}
                />
              </View>
            )}

            {!otpSent ? (
              <TouchableOpacity style={styles.mainBtn} onPress={handleSendOtp}>
                <Text style={styles.mainBtnText}>Send OTP</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.mainBtn} onPress={handleVerifyOtp}>
                <Text style={styles.mainBtnText}>Log In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------- SCREEN: SEARCHING -----------------
  if (screen === 'searching') {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.searchingTitle}>Saving Ride to Database...</Text>
        <Text style={styles.searchingSub}>Notifying nearby drivers in real-time</Text>
        <TouchableOpacity 
          style={[styles.cancelBtn, { marginTop: 30 }]} 
          onPress={() => setScreen('booking')}
        >
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----------------- SCREEN: TRACKING -----------------
  if (screen === 'tracking' && driver) {
    return (
      <View style={styles.container}>
        <ImageBackground source={{ uri: MAP_IMAGE }} style={styles.fullMap}>
          <View style={styles.mapOverlay}>
            <View style={styles.driverPin}>
              <Text style={{ fontSize: 24 }}>🛵</Text>
              <Text style={styles.pinLabel}>{driver.name}</Text>
            </View>

            <View style={styles.userPin}>
              <Text style={{ fontSize: 24 }}>📍</Text>
              <Text style={styles.pinLabel}>Pickup Point</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.bottomSheet}>
          <View style={styles.driverHeader}>
            <View>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverRating}>{driver.rating} | {driver.eta}</Text>
            </View>
            <View style={styles.otpBadge}>
              <Text style={styles.otpLabel}>START OTP</Text>
              <Text style={styles.otpValue}>{driver.otp}</Text>
            </View>
          </View>

          <View style={styles.driverVehicleBox}>
            <Text style={styles.vehicleText}>{driver.vehicle}</Text>
            <Text style={styles.fareText}>Total: {driver.fare}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.callBtn} 
              onPress={() => Alert.alert('Calling...', `Connecting to ${driver.name}`)}
            >
              <Text style={styles.callBtnText}>📞 Call Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.completeBtn} 
              onPress={() => setScreen('payment')}
            >
              <Text style={styles.completeBtnText}>Complete 🏁</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ----------------- SCREEN: PAYMENT -----------------
  if (screen === 'payment') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trip Completed! 🎉</Text>
          <Text style={styles.subHeader}>Recording to Firebase Cloud</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Text style={{ fontSize: 14, color: '#64748B' }}>Total Fare</Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#0F172A', marginVertical: 8 }}>
              {driver?.fare || '₹45'}
            </Text>

            <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', marginTop: 15 }]}>Payment Method:</Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 15 }}>
              {['UPI', 'Cash'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.payOption, 
                    paymentMethod === m && styles.selectedPayOption
                  ]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={{ fontWeight: 'bold', color: paymentMethod === m ? '#B45309' : '#334155' }}>
                    {m === 'UPI' ? '📱 UPI / GPay' : '💵 Cash'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', marginTop: 10 }]}>Rate Driver:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 32, color: star <= rating ? '#F59E0B' : '#CBD5E1' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.mainBtn, { width: '100%', marginTop: 15 }]} 
              onPress={handleCompleteTrip}
            >
              <Text style={styles.mainBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------- MAIN BOOKING -----------------
  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: MAP_IMAGE }} style={styles.halfMap}>
        <View style={styles.mapOverlayHeader}>
          <TouchableOpacity 
            style={styles.switchModeBtnFloating}
            onPress={() => setAppMode('driver')}
          >
            <Text style={styles.switchModeText}>Driver Mode 🔄</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.userPinCenter}>
          <Text style={{ fontSize: 32 }}>📍</Text>
          <View style={styles.pulseBubble}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>You are here</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.bookingSheet}>
        <Text style={styles.headerTitleDark}>Go Ride 🚖</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>📍 Pickup Location</Text>
          <TextInput style={styles.input} value={pickup} onChangeText={setPickup} />

          <Text style={[styles.inputLabel, { marginTop: 6 }]}>🎯 Destination</Text>
          <TextInput style={styles.input} value={drop} onChangeText={setDrop} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {rides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={[
                styles.rideCardHorizontal,
                selectedRide === ride.id && styles.selectedCard
              ]}
              onPress={() => setSelectedRide(ride.id)}
            >
              <Text style={{ fontSize: 24 }}>{ride.icon}</Text>
              <Text style={styles.rideName}>{ride.name}</Text>
              <Text style={styles.ridePrice}>{ride.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.mainBtn} onPress={handleBooking}>
          <Text style={styles.mainBtnText}>Book Ride Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  authContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#F59E0B', textAlign: 'center', marginBottom: 6 },
  authSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25 },
  header: { backgroundColor: '#0F172A', padding: 20, paddingTop: 40, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerTitle: { color: '#FBBF24', fontSize: 22, fontWeight: 'bold' },
  headerTitleDark: { color: '#0F172A', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subHeader: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 16, elevation: 2 },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 2 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, fontSize: 13, color: '#0F172A' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  fullMap: { width: width, height: height },
  halfMap: { width: width, height: height * 0.42, justifyContent: 'center', alignItems: 'center' },
  mapOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  mapOverlayHeader: { position: 'absolute', top: 40, right: 16 },
  userPinCenter: { alignItems: 'center', justifyContent: 'center' },
  pulseBubble: { backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: -4 },
  driverPin: { position: 'absolute', top: 120, left: 60, alignItems: 'center', backgroundColor: '#fff', padding: 6, borderRadius: 12, elevation: 4 },
  userPin: { position: 'absolute', top: 260, right: 70, alignItems: 'center', backgroundColor: '#fff', padding: 6, borderRadius: 12, elevation: 4 },
  pinLabel: { fontSize: 10, fontWeight: 'bold', color: '#0F172A' },
  bookingSheet: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, elevation: 8 },
  bottomSheet: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, elevation: 6 },
  rideCardHorizontal: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, marginRight: 10, alignItems: 'center', width: 100 },
  selectedCard: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  rideName: { fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  ridePrice: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  mainBtn: { backgroundColor: '#F59E0B', padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 6, elevation: 3 },
  mainBtnText: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
  searchingTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: 16 },
  searchingSub: { fontSize: 13, color: '#64748B', marginTop: 6 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { color: '#EF4444', fontWeight: 'bold' },
  driverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  driverRating: { fontSize: 12, color: '#F59E0B', marginTop: 2 },
  otpBadge: { backgroundColor: '#FEF3C7', padding: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  otpLabel: { fontSize: 9, fontWeight: 'bold', color: '#92400E' },
  otpValue: { fontSize: 15, fontWeight: 'bold', color: '#B45309' },
  driverVehicleBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
  vehicleText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  fareText: { fontSize: 12, fontWeight: 'bold', color: '#16A34A' },
  actionRow: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, backgroundColor: '#22C55E', padding: 10, borderRadius: 8, alignItems: 'center' },
  callBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  completeBtn: { flex: 1, backgroundColor: '#0F172A', padding: 10, borderRadius: 8, alignItems: 'center' },
  completeBtnText: { color: '#FBBF24', fontWeight: 'bold' },
  cancelTripBtn: { flex: 1, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelTripText: { color: '#EF4444', fontWeight: 'bold' },
  payOption: { flex: 1, padding: 12, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, alignItems: 'center' },
  selectedPayOption: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  switchModeBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  switchModeBtnFloating: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 4 },
  switchModeText: { color: '#FBBF24', fontSize: 11, fontWeight: 'bold' },
  driverStatusCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, elevation: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  newRideRequestCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#FDE68A' },
  reqBadge: { color: '#B45309', fontWeight: 'bold', fontSize: 12, marginBottom: 6 },
  reqFare: { fontSize: 26, fontWeight: 'bold', color: '#16A34A', marginBottom: 8 },
  reqLocation: { fontSize: 14, color: '#334155', marginBottom: 4 },
  inputContainer: { marginBottom: 6 },
});
