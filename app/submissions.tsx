import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import SubmissionsList from '../components/SubmissionsList';

export default function SubmissionsPage() {
  return (
    <PaperProvider>
      <View style={styles.container}>
        <SubmissionsList />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
}); 