import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getServerBaseUrl } from '../../config/apiConfig';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';

const AdminDashboardScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [statistics, setStatistics] = useState({
    totalBookingsToday: 0,
    activeTrains: 0,
    totalRevenue: 0,
    pendingTickets: 0,
  });
  const [assignedTrains, setAssignedTrains] = useState([]);

  // Fetch weather data from OpenWeatherMap API
  const fetchWeatherData = useCallback(async () => {
    try {
      // Using Colombo, Sri Lanka as default location for LRT system
      // For demo, using mock data with realistic values
      setWeatherData({
        temperature: Math.floor(Math.random() * 5) + 26, // 26-31°C typical for Sri Lanka
        condition: ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 20) + 70, // 70-90%
        wind: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
        icon: 'partly-sunny',
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData({
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        wind: 8,
        icon: 'partly-sunny',
      });
    }
  }, []);

  // Fetch recent bookings from server
  const fetchRecentBookings = useCallback(async () => {
    try {
      const baseUrl = await getServerBaseUrl();
      const response = await fetch(`${baseUrl}/api/tickets`);
      if (response.ok) {
        const data = await response.json();
        // Get today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = data.filter(booking => {
          const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
          return bookingDate === today;
        });
        setRecentBookings(todayBookings.slice(0, 5));
        
        // Calculate statistics (without activeTrains count for now)
        const totalRevenue = todayBookings.reduce((sum, b) => sum + (b.paymentDetails?.amount || 0), 0);
        setStatistics(prev => ({
          ...prev,
          totalBookingsToday: todayBookings.length,
          totalRevenue: totalRevenue,
          pendingTickets: todayBookings.filter(b => b.status === 'Confirmed').length,
        }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []); // No dependencies needed

  // Fetch assigned trains
  const fetchAssignedTrains = useCallback(async () => {
    try {
      const baseUrl = await getServerBaseUrl();
      const response = await fetch(`${baseUrl}/api/trains`);
      if (response.ok) {
        const data = await response.json();
        // For demo, assign first 3 trains to admin
        const trains = data.slice(0, 3).map(train => ({
          id: train._id,
          name: train.name,
          trainNumber: train.trainNumber,
          routeFrom: train.route?.split(' to ')[0] || 'Unknown',
          routeTo: train.route?.split(' to ')[1] || 'Unknown',
          departureTime: train.departureTime || '10:00 AM',
          currentStation: 'Central Station',
          nextStation: 'Next Stop',
          status: ['On Time', 'Delayed', 'Running'][Math.floor(Math.random() * 3)],
          passengersCount: Math.floor(Math.random() * 100),
        }));
        setAssignedTrains(trains);
      }
    } catch (error) {
      console.error('Error fetching trains:', error);
      // Fallback to mock data
      setAssignedTrains([
        {
          id: '1',
          name: 'Express 101',
          trainNumber: 'EXP-101',
          routeFrom: 'Central Station',
          routeTo: 'North Terminal',
          departureTime: '10:00 AM',
          currentStation: 'Central Station',
          nextStation: 'East Hub',
          status: 'On Time',
          passengersCount: 65,
        },
      ]);
    }
  }, []);

  // Load all data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchWeatherData(),
      fetchAssignedTrains(),
    ]);
    await fetchRecentBookings();
    setLoading(false);
  }, [fetchWeatherData, fetchAssignedTrains, fetchRecentBookings]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Update active trains count when assignedTrains changes
  useEffect(() => {
    const activeCount = assignedTrains.filter(t => t.status === 'On Time' || t.status === 'Running').length;
    setStatistics(prev => ({
      ...prev,
      activeTrains: activeCount,
    }));
  }, [assignedTrains]);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      // Only refresh bookings and weather, not trains
      fetchRecentBookings();
      fetchWeatherData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const styles = getStyles(isDarkMode, colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'Admin'}</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="ticket-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{statistics.totalBookingsToday}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Bookings Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="train-outline" size={24} color="#27ae60" />
          <Text style={[styles.statValue, { color: colors.text }]}>{statistics.activeTrains}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Active Trains</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="cash-outline" size={24} color="#f39c12" />
          <Text style={[styles.statValue, { color: colors.text }]}>Rs.{statistics.totalRevenue}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="time-outline" size={24} color="#e74c3c" />
          <Text style={[styles.statValue, { color: colors.text }]}>{statistics.pendingTickets}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Pending</Text>
        </View>
      </View>

      {/* Weather Card */}
      {weatherData && (
        <View style={[styles.weatherCard, { backgroundColor: colors.card }]}>
          <View style={styles.weatherHeader}>
            <View>
              <Text style={[styles.weatherTitle, { color: colors.text }]}>Current Weather</Text>
              <Text style={[styles.weatherLocation, { color: colors.placeholder }]}>Colombo, Sri Lanka</Text>
            </View>
            <Ionicons name={weatherData.icon} size={40} color="#f39c12" />
          </View>
          <View style={styles.weatherDetails}>
            <View style={styles.weatherMainInfo}>
              <Text style={[styles.temperature, { color: colors.text }]}>{weatherData.temperature}°C</Text>
              <Text style={[styles.weatherCondition, { color: colors.text }]}>{weatherData.condition}</Text>
            </View>
            <View style={styles.weatherExtraInfo}>
              <View style={styles.weatherInfoItem}>
                <Ionicons name="water-outline" size={16} color={colors.placeholder} />
                <Text style={[styles.weatherInfoText, { color: colors.placeholder }]}>{weatherData.humidity}%</Text>
              </View>
              <View style={styles.weatherInfoItem}>
                <Ionicons name="speedometer-outline" size={16} color={colors.placeholder} />
                <Text style={[styles.weatherInfoText, { color: colors.placeholder }]}>{weatherData.wind} km/h</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Live Bookings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Bookings</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        {recentBookings.length > 0 ? (
          recentBookings.map((booking, index) => (
            <View key={booking._id || index} style={[styles.bookingCard, { backgroundColor: colors.card }]}>
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={[styles.bookingTrain, { color: colors.text }]}>
                    {booking.trainDetails?.trainName || 'Unknown Train'}
                  </Text>
                  <Text style={[styles.bookingRoute, { color: colors.placeholder }]}>
                    {booking.trainDetails?.from} → {booking.trainDetails?.to}
                  </Text>
                </View>
                <View style={[styles.bookingStatus, 
                  { backgroundColor: booking.status === 'Confirmed' ? '#e8f5e9' : '#fff3e0' }]}>
                  <Text style={[styles.bookingStatusText, 
                    { color: booking.status === 'Confirmed' ? '#27ae60' : '#f39c12' }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetailItem}>
                  <Ionicons name="person-outline" size={14} color={colors.placeholder} />
                  <Text style={[styles.bookingDetailText, { color: colors.placeholder }]}>
                    {booking.passengerDetails?.name}
                  </Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                  <Text style={[styles.bookingDetailText, { color: colors.placeholder }]}>
                    {booking.trainDetails?.date}
                  </Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <Ionicons name="cash-outline" size={14} color={colors.placeholder} />
                  <Text style={[styles.bookingDetailText, { color: colors.placeholder }]}>
                    Rs.{booking.paymentDetails?.amount || 0}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="ticket-outline" size={48} color={colors.placeholder} />
            <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>No bookings today</Text>
          </View>
        )}
      </View>

      {/* Assigned Trains Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Assigned Trains</Text>
        {assignedTrains.map((train) => (
          <View key={train.id} style={[styles.trainCard, { backgroundColor: colors.card }]}>
            <View style={styles.trainCardHeader}>
              <View>
                <Text style={[styles.trainName, { color: colors.text }]}>{train.name}</Text>
                <Text style={[styles.trainNumber, { color: colors.placeholder }]}>#{train.trainNumber}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: train.status === 'On Time' ? '#e8f5e9' :
                                   train.status === 'Delayed' ? '#ffebee' :
                                   train.status === 'Running' ? '#e3f2fd' : '#f5f5f5' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: train.status === 'On Time' ? '#27ae60' :
                           train.status === 'Delayed' ? '#e74c3c' :
                           train.status === 'Running' ? '#3498db' : '#95a5a6' }
                ]}>{train.status}</Text>
              </View>
            </View>
            
            <View style={styles.trainRoute}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={[styles.routeText, { color: colors.text }]}>
                {train.routeFrom} → {train.routeTo}
              </Text>
            </View>
            
            <View style={styles.trainInfo}>
              <View style={styles.trainInfoItem}>
                <Ionicons name="time-outline" size={16} color={colors.placeholder} />
                <Text style={[styles.trainInfoText, { color: colors.placeholder }]}>{train.departureTime}</Text>
              </View>
              <View style={styles.trainInfoItem}>
                <Ionicons name="people-outline" size={16} color={colors.placeholder} />
                <Text style={[styles.trainInfoText, { color: colors.placeholder }]}>{train.passengersCount} passengers</Text>
              </View>
            </View>
            
            <View style={styles.stationInfo}>
              <View style={styles.stationColumn}>
                <Text style={[styles.stationLabel, { color: colors.placeholder }]}>Current</Text>
                <Text style={[styles.stationValue, { color: colors.text }]}>{train.currentStation}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.placeholder} />
              <View style={styles.stationColumn}>
                <Text style={[styles.stationLabel, { color: colors.placeholder }]}>Next</Text>
                <Text style={[styles.stationValue, { color: colors.text }]}>{train.nextStation}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.trackingButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AdminTracking', { trainId: train.id })}
            >
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.trackingButtonText}>View Live Tracking</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');
const cardMargin = 16;
const cardWidth = (width - cardMargin * 3) / 2;

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.placeholder,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: cardMargin,
    marginBottom: 10,
  },
  statCard: {
    width: cardWidth,
    padding: 15,
    borderRadius: 12,
    marginBottom: cardMargin,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.5 : 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  weatherCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.5 : 0.1,
    shadowRadius: 2,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weatherLocation: {
    fontSize: 14,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMainInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 16,
  },
  weatherExtraInfo: {
    flexDirection: 'row',
    gap: 15,
  },
  weatherInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherInfoText: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.5 : 0.1,
    shadowRadius: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingTrain: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingRoute: {
    fontSize: 14,
  },
  bookingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 13,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
  },
  trainCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.5 : 0.1,
    shadowRadius: 2,
  },
  trainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trainName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trainNumber: {
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  trainRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 14,
  },
  trainInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  trainInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trainInfoText: {
    fontSize: 13,
  },
  stationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    marginBottom: 12,
  },
  stationColumn: {
    flex: 1,
  },
  stationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  stationValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  trackingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AdminDashboardScreen;
