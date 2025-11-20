import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import ChatBot from '../../components/ChatBot';
import chatbotService from '../../services/chatbotService';

const ChatBotScreen = () => {
  const { colors } = useTheme();
  const user = useSelector(selectUser);
  const navigation = useNavigation();
  
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    // Initialize chatbot
    const welcomeMessage = chatbotService.initialize(user);
    setMessages([welcomeMessage]);
    setQuickActions(chatbotService.getQuickActions());
  }, [user]);

  const handleSendMessage = async (text) => {
    // Add user message to chat
    const userMessage = {
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Minimal typing delay for instant feel
    setTimeout(async () => {
      try {
        // Process message and get bot response with timeout
        const botResponse = await Promise.race([
          chatbotService.processMessage(text),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 10000)
          )
        ]);
        
        // Check if response contains navigation action
        if (botResponse.actions) {
          botResponse.actions = botResponse.actions.map(action => ({
            ...action,
            onPress: () => {
              const result = action.onPress();
              console.log('Navigation action triggered:', result);
              if (result?.navigate) {
                console.log('Navigating to:', result.navigate);
                navigation.navigate(result.navigate);
              }
            },
          }));
        }
        
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error processing message:', error);
        const errorMessage = error.message === 'Response timeout' 
          ? 'The request is taking too long. Please check your connection and try again.'
          : 'Sorry, I encountered an error. Please try again.';
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: errorMessage,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 300);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatBot
        messages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        quickActions={quickActions}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatBotScreen;
