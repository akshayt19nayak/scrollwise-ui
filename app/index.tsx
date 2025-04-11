import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import TextInputBox from '../components/TextInputBox';
import FileUploader from '../components/FileUploader';
import SubmitButton from '../components/SubmitButton';

export default function App() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<any>(null);
  const [isFormValid, setFormValid] = useState(false)

  const handleUrlInput = (text: any) => {
    console.log('text is: ', text)
    setText(text)
    const isFormValid = text.trim() !== '' || file !== null;
    setFormValid(isFormValid)
  }

  const handleSubmit = () => {
    console.log('Text:', text);
    console.log('File:', file);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.title}>ScrollWise</Text>
        <TextInputBox value={text} onChangeText={handleUrlInput} />
        <FileUploader onFileSelect={setFile} />
        <SubmitButton onPress={handleSubmit} disabled={!isFormValid} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
});