import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { api } from '../services/api';

interface Submission {
  id: number;
  text: string;
  created_at: string;
}

interface SubmissionWithSummary extends Submission {
  summary?: string;
  isLoadingSummary?: boolean;
}

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<SubmissionWithSummary[]>([]);
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

  const handleSubmissionClick = async (submission: SubmissionWithSummary) => {
    // If we already have a summary, toggle it
    if (submission.summary !== undefined) {
      setSubmissions(submissions.map(s => 
        s.id === submission.id 
          ? { ...s, summary: undefined }
          : s
      ));
      return;
    }

    // Set loading state for this submission
    setSubmissions(submissions.map(s => 
      s.id === submission.id 
        ? { ...s, isLoadingSummary: true }
        : s
    ));

    try {
      const summary = await api.getSummary(submission.text);
      setSubmissions(submissions.map(s => 
        s.id === submission.id 
          ? { ...s, summary, isLoadingSummary: false }
          : s
      ));
    } catch (err: any) {
      console.error('Error getting summary:', err);
      // Show error message to user
      Alert.alert(
        'Error', 
        err.response?.data?.error || 'Failed to generate summary. This might not be a valid YouTube URL.'
      );
      setSubmissions(submissions.map(s => 
        s.id === submission.id 
          ? { ...s, isLoadingSummary: false }
          : s
      ));
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
        <TouchableOpacity 
          key={submission.id} 
          onPress={() => handleSubmissionClick(submission)}
        >
          <Card style={styles.card}>
            <Card.Content>
              <Title>Submission #{submission.id}</Title>
              <Paragraph>{submission.text}</Paragraph>
              <Paragraph style={styles.timestamp}>
                {new Date(submission.created_at).toLocaleString()}
              </Paragraph>
              {submission.isLoadingSummary && (
                <View style={styles.summaryContainer}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>Generating summary...</Text>
                  </View>
                </View>
              )}
              {submission.summary && (
                <View style={styles.summaryContainer}>
                  <Title style={styles.summaryTitle}>Summary</Title>
                  <Paragraph>{submission.summary}</Paragraph>
                </View>
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
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
  summaryContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#ffffff',
  },
}); 