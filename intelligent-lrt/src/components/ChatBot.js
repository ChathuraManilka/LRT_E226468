import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ChatBot = ({ onSendMessage, messages, isTyping, quickActions }) => {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleQuickAction = (action) => {
    onSendMessage(action.text);
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#fff' : colors.text },
            ]}
          >
            {message.text}
          </Text>
          
          {message.actions && message.actions.length > 0 && (
            <View style={styles.actionButtonsContainer}>
              {message.actions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.actionButton, { borderColor: colors.primary }]}
                  onPress={() => action.onPress()}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {message.data && (
            <View style={styles.dataContainer}>
              {renderMessageData(message.data, colors)}
            </View>
          )}
        </View>
        
        {isUser && (
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderMessageData = (data, colors) => {
    if (data.type === 'train') {
      return (
        <View style={styles.trainCard}>
          <Text style={[styles.trainName, { color: colors.text }]}>{data.name}</Text>
          <Text style={[styles.trainDetail, { color: colors.placeholder }]}>
            Route: {data.route}
          </Text>
          <Text style={[styles.trainDetail, { color: colors.placeholder }]}>
            Status: {data.status}
          </Text>
        </View>
      );
    }
    
    if (data.type === 'ticket') {
      return (
        <View style={styles.ticketCard}>
          <Text style={[styles.ticketTitle, { color: colors.text }]}>
            Ticket #{data.ticketNumber}
          </Text>
          <Text style={[styles.ticketDetail, { color: colors.placeholder }]}>
            From: {data.from} → To: {data.to}
          </Text>
          <Text style={[styles.ticketDetail, { color: colors.placeholder }]}>
            Date: {data.date}
          </Text>
          <Text style={[styles.ticketDetail, { color: colors.placeholder }]}>
            Status: {data.status}
          </Text>
        </View>
      );
    }
    
    if (data.type === 'schedule') {
      return (
        <View style={styles.scheduleCard}>
          <Text style={[styles.scheduleTime, { color: colors.text }]}>
            {data.departureTime}
          </Text>
          <Text style={[styles.scheduleDetail, { color: colors.placeholder }]}>
            {data.from} → {data.to}
          </Text>
          <Text style={[styles.scheduleDetail, { color: colors.placeholder }]}>
            Train: {data.trainName}
          </Text>
        </View>
      );
    }
    
    if (data.type === 'notice') {
      return (
        <View style={styles.noticeCard}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>{data.title}</Text>
          <Text style={[styles.noticeContent, { color: colors.placeholder }]}>
            {data.content}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.placeholder }]}>
                Assistant is typing...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {quickActions && quickActions.length > 0 && (
        <ScrollView
          horizontal
          style={styles.quickActionsContainer}
          contentContainerStyle={styles.quickActionsContent}
          showsHorizontalScrollIndicator={false}
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionButton, { backgroundColor: colors.card }]}
              onPress={() => handleQuickAction(action)}
            >
              <Ionicons name={action.icon} size={20} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Type your message..."
          placeholderTextColor={colors.placeholder}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.primary : colors.border },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataContainer: {
    marginTop: 8,
  },
  trainCard: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  trainName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trainDetail: {
    fontSize: 13,
    marginBottom: 2,
  },
  ticketCard: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ticketDetail: {
    fontSize: 13,
    marginBottom: 2,
  },
  scheduleCard: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleDetail: {
    fontSize: 13,
    marginBottom: 2,
  },
  noticeCard: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    maxHeight: 60,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickActionsContent: {
    padding: 8,
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'android' ? 50 : 25,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
    marginBottom: Platform.OS === 'android' ? 30 : 10,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatBot;
