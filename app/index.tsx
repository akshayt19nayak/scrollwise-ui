import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { PaperProvider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import TextInputBox from '../components/TextInputBox';
import FileUploader from '../components/FileUploader';
import SubmitButton from '../components/SubmitButton';
import { api } from '../services/api';

export default function App() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<any>(null);
  const [isFormValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlInput = (url: any) => {
    console.log('text is: ', url)
    setUrl(url)
    const isFormValid = url.trim() !== '' || file !== null;
    setFormValid(isFormValid)
  }

  const handleSubmit = async () => {
    console.log('url is: ', url)
    console.log('file is: ', file)
    setIsSubmitting(true);
    try {
      const result = await api.saveSubmission(url);
      Alert.alert('Success', 'Text saved successfully!');
      setUrl(''); // Clear the input
      setFormValid(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save text. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToSubmissions = () => {
    router.push('/submissions');
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.title}>ScrollWise</Text>
        <View style={styles.inputSection}>
          <TextInputBox value={url} onChangeText={handleUrlInput} />
          <FileUploader onFileSelect={setFile} />
          <SubmitButton onPress={handleSubmit} disabled={!isFormValid || isSubmitting} />
        </View>
        <View style={styles.buttonSection}>
          <Button 
            mode="contained" 
            onPress={navigateToSubmissions}
            style={styles.submissionsButton}
          >
            View Past Submissions
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  buttonSection: {
    marginBottom: 16,
  },
  submissionsButton: {
    marginBottom: 8,
  },
});