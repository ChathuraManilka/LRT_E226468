import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  TextInput,
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { googleSignIn } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.auth);
  const { colors } = useTheme();
  
  // Admin credentials
  const SUPER_ADMIN_EMAIL = 'salrt.v1@gmail.com';
  const SUPER_ADMIN_PASSWORD = 'superadmin.lrt';
  const ADMIN_EMAIL = 'intelligentlrta@gmail.com';
  const ADMIN_PASSWORD = 'admin.lrt';
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Common valid email domains - STRICT LIST
  const validDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'zoho.com',
    'mail.com', 'yandex.com', 'gmx.com', 'inbox.com', 'fastmail.com',
    'me.com', 'mac.com', 'googlemail.com', 'pm.me',
    // Educational domains
    'edu', 'ac.uk', 'edu.au', 'edu.in', 'ac.in', 'edu.lk', 'ac.lk',
    // Work/Business domains
    'work.com', 'company.com', 'business.com', 'corporate.com'
  ];
  
  // Strict email validation - only accepts known domains
  const validateEmail = (email) => {
    // Basic format check - must have username, @, domain, and extension
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Extract domain
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    // STRICT CHECK: Domain must be in the valid list or end with a valid domain
    const isValidDomain = validDomains.some(validDomain => {
      // Exact match (e.g., gmail.com)
      if (domain === validDomain) return true;
      
      // Subdomain match (e.g., mail.google.com ends with google.com)
      if (domain.endsWith('.' + validDomain)) return true;
      
      // Educational domain check (e.g., student.university.edu)
      if (validDomain === 'edu' && domain.endsWith('.edu')) return true;
      if (validDomain === 'ac.uk' && domain.endsWith('.ac.uk')) return true;
      if (validDomain === 'edu.au' && domain.endsWith('.edu.au')) return true;
      if (validDomain === 'ac.in' && domain.endsWith('.ac.in')) return true;
      if (validDomain === 'edu.lk' && domain.endsWith('.edu.lk')) return true;
      if (validDomain === 'ac.lk' && domain.endsWith('.ac.lk')) return true;
      
      return false;
    });
    
    return isValidDomain;
  };
  
  // Check if email is admin email
  const checkIfAdminEmail = (emailText) => {
    const trimmedEmail = emailText.trim().toLowerCase();
    return trimmedEmail === SUPER_ADMIN_EMAIL || trimmedEmail === ADMIN_EMAIL;
  };
  
  // Handle email change
  const handleEmailChange = (text) => {
    setEmail(text);
    const isAdmin = checkIfAdminEmail(text);
    setIsAdminEmail(isAdmin);
    if (!isAdmin) {
      setPassword('');
    }
  };
  
  // Handle login
  const handleLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    const isValid = validateEmail(trimmedEmail);
    
    if (!isValid) {
      Alert.alert(
        'Invalid Email', 
        'Please enter a valid email address with a recognized domain (e.g., gmail.com, yahoo.com, etc.)'
      );
      return;
    }
    
    // Check if it's admin or superadmin email
    if (trimmedEmail === SUPER_ADMIN_EMAIL || trimmedEmail === ADMIN_EMAIL) {
      handleAdminLogin();
    } else {
      // Regular user - login directly
      handleUserLogin(trimmedEmail);
    }
  };
  
  // Handle user login (no password required)
  const handleUserLogin = (userEmail) => {
    setIsProcessing(true);
    
    const userData = {
      id: `user-${Date.now()}`,
      name: userEmail.split('@')[0],
      email: userEmail,
      role: 'user'
    };
    
    setTimeout(() => {
      dispatch(googleSignIn(userData));
      setIsProcessing(false);
    }, 500);
  };
  
  // Handle admin/superadmin login with password
  const handleAdminLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!password) {
      Alert.alert('Error', 'Please enter the password');
      return;
    }
    
    setIsProcessing(true);
    
    let userData = null;
    let isPasswordCorrect = false;
    
    if (trimmedEmail === SUPER_ADMIN_EMAIL) {
      if (password === SUPER_ADMIN_PASSWORD) {
        isPasswordCorrect = true;
        userData = {
          id: 'superadmin-123',
          name: 'Super Admin',
          email: SUPER_ADMIN_EMAIL,
          role: 'superadmin'
        };
      }
    } else if (trimmedEmail === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        isPasswordCorrect = true;
        userData = {
          id: 'admin-123',
          name: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin'
        };
      }
    }
    
    setTimeout(() => {
      if (isPasswordCorrect && userData) {
        dispatch(googleSignIn(userData));
      } else {
        Alert.alert('Error', 'Incorrect password');
        setPassword('');
      }
      setIsProcessing(false);
    }, 500);
  };
  
  // Reset form
  const handleReset = () => {
    setEmail('');
    setPassword('');
    setIsAdminEmail(false);
    setShowPassword(false);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../assets/images/new.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appTitle, { color: colors.text }]}>
            Intelligent LRT
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.placeholder }]}>
            Smart Railway Management System
          </Text>
        </View>

        {/* Login Form Section */}
        <View style={styles.loginSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sign In
          </Text>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: colors.surface, 
                borderColor: isAdminEmail ? colors.primary : colors.border 
              }
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={colors.placeholder} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isProcessing}
              />
              {isAdminEmail && (
                <Ionicons 
                  name="shield-checkmark" 
                  size={20} 
                  color={colors.primary}
                  style={styles.validationIcon}
                />
              )}
            </View>
            {isAdminEmail && (
              <Text style={[styles.validationText, { color: colors.primary }]}>
                🔐 Admin account - Password required
              </Text>
            )}
          </View>

          {/* Password Input (shown only for admin/superadmin) */}
          {isAdminEmail && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={colors.placeholder} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isProcessing}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              isProcessing && styles.disabledButton
            ]}
            onPress={handleLogin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.textLight }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color={colors.placeholder} />
            <Text style={[styles.infoText, { color: colors.placeholder }]}>
              {isAdminEmail ? 'Admin login requires password' : 'Regular users can sign in without password'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            © 2025 Intelligent LRT System
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  loginSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 54,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  validationIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  validationText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  primaryButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default LoginScreen;
