import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { api } from '../services/api';

interface Submission {
  id: number;
  text: string;
  created_at: string;
}

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await api.getAllSubmissions();
      setSubmissions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading submissions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {submissions.map((submission) => (
        <Card key={submission.id} style={styles.card}>
          <Card.Content>
            <Title>Submission #{submission.id}</Title>
            <Paragraph>{submission.text}</Paragraph>
            <Paragraph style={styles.timestamp}>
              {new Date(submission.created_at).toLocaleString()}
            </Paragraph>
          </Card.Content>
        </Card>
      ))}
      {submissions.length === 0 && (
        <Text style={styles.emptyText}>No submissions yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
}); 