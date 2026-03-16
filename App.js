import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Platform, StatusBar, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

// ========== NOTIFICATION SETUP ==========
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ========== VEHICLE LIST (ඔයාගේ Excel එකෙන්) ==========
const VEHICLES = [
  '65-9227','CAL-0820','CAN-6868','DAD-9980','DAF-9321',
  'GH-9617','GQ-9720','GY-5175','HB-5358','HT-7350',
  'JD-1135','JG-2345','KG-9152','KH-0876','KH-3096',
  'KK-4772','KP-9436','KU-5337','PB-5821','PB-5823',
  'PB-6189','PB-7089','PB-7368','PB-8225','PB-8415',
  'PB-8669','PB-8829','PE-4297','BKE-7410','BKH-2253'
];

const REMINDER_DAYS = 14; // සති 2 = දින 14

// ========== HELPER FUNCTIONS ==========
function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return 'දිනය නොමැත';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getStatusColor(days) {
  if (days === null) return '#888';
  if (days < 0) return '#FF3B30';
  if (days <= 14) return '#FF9500';
  return '#34C759';
}

function getStatusLabel(days) {
  if (days === null) return '⚪ දිනය නොමැත';
  if (days < 0) return `🔴 Expired (දින ${Math.abs(days)}කට කලින්)`;
  if (days === 0) return '🔴 අද Expire වෙනවා!';
  if (days <= 14) return `🟠 දින ${days}ක් ඉතුරුයි`;
  return `🟢 දින ${days}ක් ඉතුරුයි`;
}

// ========== NOTIFICATION SCHEDULING ==========
async function scheduleNotification(vehicleNo, type, dateStr) {
  if (!dateStr) return;

  const expiry = new Date(dateStr);
  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - REMINDER_DAYS);
  reminderDate.setHours(8, 0, 0, 0);

  const now = new Date();
  if (reminderDate <= now) return;

  // පරණ notification cancel කරන්න
  const oldId = await AsyncStorage.getItem(`notif_${vehicleNo}_${type}`);
  if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId);

  const typeLabel = type === 'license' ? 'බලපත්‍රය (License)' : 'රක්ෂණය (Insurance)';
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ ${vehicleNo} - ${typeLabel} Expire වෙනවා!`,
      body: `${formatDate(dateStr)} දිනට සති 2ක් ඉතුරුයි. දැනම අලුත් කරන්න.`,
      sound: true,
      data: { vehicleNo, type },
    },
    trigger: reminderDate,
  });

  await AsyncStorage.setItem(`notif_${vehicleNo}_${type}`, id);
}

// ========== MAIN APP ==========
export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editData, setEditData] = useState({ license: '', insurance: '' });
  const [showPicker, setShowPicker] = useState({ visible: false, field: '' });
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all'); // all | expiring | expired

  // Permission request
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('අවධානය', 'Notifications ලැබෙන්න Permission දෙන්න Settings > Apps > VehicleTracker');
      }
    })();
    loadData();
  }, []);

  async function loadData() {
    const data = await Promise.all(VEHICLES.map(async (v) => {
      const license = await AsyncStorage.getItem(`${v}_license`) || '';
      const insurance = await AsyncStorage.getItem(`${v}_insurance`) || '';
      return { id: v, license, insurance };
    }));
    setVehicles(data);
  }

  async function saveVehicle() {
    const { id } = selectedVehicle;
    await AsyncStorage.setItem(`${id}_license`, editData.license);
    await AsyncStorage.setItem(`${id}_insurance`, editData.insurance);
    await scheduleNotification(id, 'license', editData.license);
    await scheduleNotification(id, 'insurance', editData.insurance);
    await loadData();
    setModalVisible(false);
    Alert.alert('✅ Saved!', `${id} - දත්ත save කළා.\nReminder set කළා!`);
  }

  function openEdit(vehicle) {
    setSelectedVehicle(vehicle);
    setEditData({ license: vehicle.license, insurance: vehicle.insurance });
    setModalVisible(true);
  }

  function onDateChange(event, date) {
    setShowPicker({ visible: false, field: '' });
    if (date) {
      setEditData(prev => ({ ...prev, [showPicker.field]: date.toISOString() }));
    }
  }

  // Filter logic
  const filtered = vehicles.filter(v => {
    const matchSearch = v.id.toLowerCase().includes(searchText.toLowerCase());
    const licDays = getDaysLeft(v.license);
    const insDays = getDaysLeft(v.insurance);
    if (filter === 'expiring') {
      return matchSearch && (
        (licDays !== null && licDays >= 0 && licDays <= 14) ||
        (insDays !== null && insDays >= 0 && insDays <= 14)
      );
    }
    if (filter === 'expired') {
      return matchSearch && ((licDays !== null && licDays < 0) || (insDays !== null && insDays < 0));
    }
    return matchSearch;
  });

  const expiringCount = vehicles.filter(v => {
    const l = getDaysLeft(v.license), i = getDaysLeft(v.insurance);
    return (l !== null && l >= 0 && l <= 14) || (i !== null && i >= 0 && i <= 14);
  }).length;

  const expiredCount = vehicles.filter(v => {
    const l = getDaysLeft(v.license), i = getDaysLeft(v.insurance);
    return (l !== null && l < 0) || (i !== null && i < 0);
  }).length;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Vehicle Tracker</Text>
        <Text style={styles.headerSub}>වාහන Document Manager</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statBox, { borderColor: '#34C759' }]} onPress={() => setFilter('all')}>
          <Text style={styles.statNum}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>සියලු</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statBox, { borderColor: '#FF9500' }]} onPress={() => setFilter('expiring')}>
          <Text style={[styles.statNum, { color: '#FF9500' }]}>{expiringCount}</Text>
          <Text style={styles.statLabel}>ළඟදීම</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statBox, { borderColor: '#FF3B30' }]} onPress={() => setFilter('expired')}>
          <Text style={[styles.statNum, { color: '#FF3B30' }]}>{expiredCount}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Vehicle number search..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Vehicle List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const licDays = getDaysLeft(item.license);
          const insDays = getDaysLeft(item.insurance);
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.vehicleNo}>🚙 {item.id}</Text>
                <Text style={styles.editBtn}>✏️ Edit</Text>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.docBox}>
                  <Text style={styles.docTitle}>📋 License</Text>
                  <Text style={styles.docDate}>{formatDate(item.license)}</Text>
                  <Text style={[styles.docStatus, { color: getStatusColor(licDays) }]}>
                    {getStatusLabel(licDays)}
                  </Text>
                </View>
                <View style={[styles.docBox, { borderLeftWidth: 1, borderLeftColor: '#333' }]}>
                  <Text style={styles.docTitle}>🛡️ Insurance</Text>
                  <Text style={styles.docDate}>{formatDate(item.insurance)}</Text>
                  <Text style={[styles.docStatus, { color: getStatusColor(insDays) }]}>
                    {getStatusLabel(insDays)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✏️ {selectedVehicle?.id}</Text>
            <Text style={styles.modalSub}>දිනයන් ඇතුළත් කරන්න</Text>

            <Text style={styles.fieldLabel}>📋 License Expiry Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker({ visible: true, field: 'license' })}
            >
              <Text style={styles.dateBtnText}>
                {editData.license ? formatDate(editData.license) : 'දිනය තෝරන්න...'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>🛡️ Insurance Expiry Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker({ visible: true, field: 'insurance' })}
            >
              <Text style={styles.dateBtnText}>
                {editData.insurance ? formatDate(editData.insurance) : 'දිනය තෝරන්න...'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveVehicle}>
                <Text style={styles.saveBtnText}>💾 Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showPicker.visible && (
        <DateTimePicker
          value={editData[showPicker.field] ? new Date(editData[showPicker.field]) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#aaa', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, fontSize: 15 },
  card: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#252540',
  },
  vehicleNo: { fontSize: 16, fontWeight: '700', color: '#fff' },
  editBtn: { fontSize: 13, color: '#4a9eff' },
  cardRow: { flexDirection: 'row' },
  docBox: { flex: 1, padding: 12 },
  docTitle: { fontSize: 12, color: '#888', marginBottom: 4 },
  docDate: { fontSize: 13, color: '#ccc', fontWeight: '600', marginBottom: 4 },
  docStatus: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#2a2a4a',
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#888', marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: '#aaa', marginBottom: 8, marginTop: 4 },
  dateBtn: {
    backgroundColor: '#252540',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  dateBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  cancelBtnText: { color: '#aaa', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#4a9eff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});