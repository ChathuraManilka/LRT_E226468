import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../context/ThemeContext';
import { getApiBaseUrl } from '../../config/apiConfig';

const UserTicketScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setTickets([]); // Clear tickets if user logs out or is not available
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiUrl = await getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/tickets/user/${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch tickets, server response:', errorText);
        setError('Failed to fetch tickets. Please try again.');
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
      setError('Could not connect to the server. Check your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch tickets when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTickets();
    });
    return unsubscribe;
  }, [navigation, fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const TicketCard = ({ ticket }) => {
    // Determine payment status - if method is 'cash', it should be Pending
    const paymentMethod = ticket.paymentDetails?.method || '';
    let paymentStatus = ticket.paymentDetails?.status || '';
    
    // If payment method is cash, force status to Pending
    if (paymentMethod.toLowerCase() === 'cash' || paymentMethod.toLowerCase().includes('cash')) {
      paymentStatus = 'Pending';
    } else if (!paymentStatus) {
      // For card/mobile without explicit status, assume Paid
      paymentStatus = 'Paid';
    }
    
    const isPending = paymentStatus === 'Pending';
    
    // Create formatted, readable QR code text
    const qrCodeData = ticket.qrCodeValue || `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    LRT TICKET CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket ID: ${ticket._id.slice(-8).toUpperCase()}

TRAIN DETAILS:
• Train: ${ticket.trainDetails?.trainName || 'N/A'}
• Number: ${ticket.trainDetails?.trainNumber || 'N/A'}
• Route: ${ticket.trainDetails?.from || 'N/A'} → ${ticket.trainDetails?.to || 'N/A'}

SCHEDULE:
• Date: ${formatDate(ticket.trainDetails?.date)}
• Departure: ${ticket.trainDetails?.departureTime || 'N/A'}
• Arrival: ${ticket.trainDetails?.arrivalTime || 'N/A'}

PASSENGER:
• Name: ${ticket.passengerDetails?.name || 'N/A'}
• NIC: ${ticket.passengerDetails?.nic || 'N/A'}
• Phone: ${ticket.passengerDetails?.phone || 'N/A'}

SEAT INFORMATION:
• Seats: ${ticket.seatInfo?.numberOfSeats || 0}
• Numbers: ${ticket.seatInfo?.seatNumbers?.join(', ') || 'N/A'}
• Preference: ${ticket.passengerDetails?.seatPreference || 'N/A'}

PAYMENT:
• Amount: Rs. ${ticket.paymentDetails?.amount || 0}
• Method: ${ticket.paymentDetails?.method || 'N/A'}
• Status: ${paymentStatus}
${isPending ? '\n⚠️ PAYMENT PENDING - Pay at station' : '✓ Payment Completed'}

TICKET STATUS: ${ticket.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scan this code at the station
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    return (
      <View style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
        <View style={styles.ticketHeader}>
          <Text style={[styles.trainName, { color: colors.text }]}>{ticket.trainDetails.trainName}</Text>
          <Text style={[styles.ticketId, { color: colors.placeholder }]}>ID: {ticket._id.slice(-6)}</Text>
        </View>

        <View style={styles.ticketBody}>
          <TouchableOpacity 
            style={styles.qrContainer}
            onPress={() => {
              setSelectedTicket(ticket);
              setQrModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <QRCode
              value={qrCodeData}
              size={120}
              backgroundColor={colors.surface}
              color={colors.text}
              logo={require('../../../assets/images/train-logo.png')}
              logoSize={30}
              logoBackgroundColor='transparent'
            />
            <View style={[styles.tapHint, { backgroundColor: colors.primary }]}>
              <Ionicons name="expand-outline" size={12} color="#FFF" />
              <Text style={styles.tapHintText}>Tap to enlarge</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.detailsContainer}>
            <View style={styles.routeInfo}>
              <Text style={[styles.station, { color: colors.text }]}>{ticket.trainDetails.from}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.placeholder} style={styles.arrow} />
              <Text style={[styles.station, { color: colors.text }]}>{ticket.trainDetails.to}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.text }]}>{formatDate(ticket.trainDetails.date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.text }]}>{ticket.trainDetails.departureTime} - {ticket.trainDetails.arrivalTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.text }]}>{ticket.passengerDetails.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {ticket.seatInfo.numberOfSeats} Seat(s): {ticket.seatInfo.seatNumbers.join(', ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Rs. {ticket.paymentDetails?.amount || 0} - {ticket.paymentDetails?.method || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.ticketFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerRow}>
            <Text style={[styles.status, { color: ticket.status === 'Confirmed' ? colors.success : colors.error }]}>
              Status: {ticket.status}
            </Text>
            <Text style={[
              styles.paymentStatus, 
              { color: isPending ? colors.warning : colors.success }
            ]}>
              Payment: {paymentStatus}
            </Text>
          </View>
          {isPending && (
            <View style={[styles.pendingNotice, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={[styles.pendingText, { color: colors.warning }]}>
                Please pay at the station to collect your ticket
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextSection}>
            <Ionicons name="ticket" size={32} color="#FFF" style={styles.headerIcon} />
            <View>
              <Text style={styles.headerTitle}>My Tickets</Text>
              <Text style={styles.headerSubtitle}>
                {tickets.length === 0 
                  ? 'No tickets booked yet' 
                  : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'} booked`}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={() => navigation.navigate('AvailableTrains')}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]} onPress={onRefresh}>
              <Text style={styles.bookButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={80} color={colors.placeholder} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Tickets Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>
              Your booked tickets will appear here.{'\n'}
              Tap "Book Ticket" above to get started!
            </Text>
          </View>
        ) : (
          tickets.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Scan QR Code</Text>
              <TouchableOpacity 
                onPress={() => setQrModalVisible(false)}
                style={[styles.closeButton, { backgroundColor: colors.error }]}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            {selectedTicket && (
              <>
                <View style={styles.enlargedQrContainer}>
                  <QRCode
                    value={(() => {
                      const paymentMethod = selectedTicket.paymentDetails?.method || '';
                      let paymentStatus = selectedTicket.paymentDetails?.status || '';
                      
                      if (paymentMethod.toLowerCase() === 'cash' || paymentMethod.toLowerCase().includes('cash')) {
                        paymentStatus = 'Pending';
                      } else if (!paymentStatus) {
                        paymentStatus = 'Paid';
                      }
                      
                      const isPending = paymentStatus === 'Pending';
                      
                      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    LRT TICKET CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket ID: ${selectedTicket._id.slice(-8).toUpperCase()}

TRAIN DETAILS:
• Train: ${selectedTicket.trainDetails?.trainName || 'N/A'}
• Number: ${selectedTicket.trainDetails?.trainNumber || 'N/A'}
• Route: ${selectedTicket.trainDetails?.from || 'N/A'} → ${selectedTicket.trainDetails?.to || 'N/A'}

SCHEDULE:
• Date: ${formatDate(selectedTicket.trainDetails?.date)}
• Departure: ${selectedTicket.trainDetails?.departureTime || 'N/A'}
• Arrival: ${selectedTicket.trainDetails?.arrivalTime || 'N/A'}

PASSENGER:
• Name: ${selectedTicket.passengerDetails?.name || 'N/A'}
• NIC: ${selectedTicket.passengerDetails?.nic || 'N/A'}
• Phone: ${selectedTicket.passengerDetails?.phone || 'N/A'}

SEAT INFORMATION:
• Seats: ${selectedTicket.seatInfo?.numberOfSeats || 0}
• Numbers: ${selectedTicket.seatInfo?.seatNumbers?.join(', ') || 'N/A'}
• Preference: ${selectedTicket.passengerDetails?.seatPreference || 'N/A'}

PAYMENT:
• Amount: Rs. ${selectedTicket.paymentDetails?.amount || 0}
• Method: ${paymentMethod}
• Status: ${paymentStatus}
${isPending ? '\n⚠️ PAYMENT PENDING - Pay at station' : '✓ Payment Completed'}

TICKET STATUS: ${selectedTicket.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scan this code at the station
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
                    })()}
                    size={280}
                    backgroundColor="#FFFFFF"
                    color="#000000"
                    logo={require('../../../assets/images/train-logo.png')}
                    logoSize={50}
                    logoBackgroundColor='transparent'
                  />
                </View>
                
                <Text style={[styles.modalHint, { color: colors.placeholder }]}>
                  Position the QR code within the scanner frame
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Roboto-Regular',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bookButtonText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'Roboto-Bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Roboto-Regular',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Roboto-Regular',
  },
  loader: {
    marginTop: 100,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  ticketCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  trainName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  ticketId: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  ticketBody: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  station: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Medium',
    flexShrink: 1,
  },
  arrow: {
    marginHorizontal: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  ticketFooter: {
    borderTopWidth: 1,
    padding: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  footerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tapHint: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  tapHintText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  enlargedQrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHint: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
    marginTop: 8,
  },
});

export default UserTicketScreen;
