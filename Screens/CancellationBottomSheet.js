import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';

const CancellationBottomSheet = ({ 
  visible, 
  onClose, 
  onSubmit, 
  bookingTime 
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancellationReasons = [
    'Change of plans',
    'Found alternative transportation',
    'Price too high',
    'Other'
  ];

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    if (!selectedReason) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }

    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please specify your cancellation reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason); // Provided by ReceiptScreen
      resetForm();
      onClose(); // Close the modal on success
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setCustomReason('');
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cancel Ride</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Why are you cancelling this ride?</Text>

        <View style={styles.reasonsContainer}>
          {cancellationReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonButton,
                selectedReason === reason && styles.selectedReasonButton
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text 
                style={[
                  styles.reasonText,
                  selectedReason === reason && styles.selectedReasonText
                ]}
              >
                {reason}
              </Text>
              {selectedReason === reason && (
                <MaterialIcons name="check" size={20} color="#27ae60" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedReason === 'Other' && (
          <TextInput
            style={styles.input}
            placeholder="Please specify your reason..."
            value={customReason}
            onChangeText={setCustomReason}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || (selectedReason === 'Other' && !customReason.trim())) && 
              styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Cancellation'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedReasonButton: {
    borderColor: '#27ae60',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
  },
  reasonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedReasonText: {
    color: '#27ae60',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CancellationBottomSheet;
