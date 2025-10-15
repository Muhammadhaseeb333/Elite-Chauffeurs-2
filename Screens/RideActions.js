import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { updateRideStatus, RIDE_STATUS } from './rideUtils';

const RideActions = ({ rideId }) => {
  const handleStatusChange = async (newStatus) => {
    try {
      await updateRideStatus(rideId, newStatus);
      Alert.alert('Success', 'Ride status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.completeButton]}
        onPress={() => handleStatusChange(RIDE_STATUS.COMPLETED)}
      >
        <Text style={styles.buttonText}>Mark as Completed</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]}
        onPress={() => handleStatusChange(RIDE_STATUS.CANCELLED)}
      >
        <Text style={styles.buttonText}>Cancel Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
};

export default RideActions;