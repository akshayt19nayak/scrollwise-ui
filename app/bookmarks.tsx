import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import BookmarksList from '@/components/BookmarksList';

export default function BookmarksPage() {
  return (
    <PaperProvider>
      <View style={styles.container}>
        <BookmarksList />
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