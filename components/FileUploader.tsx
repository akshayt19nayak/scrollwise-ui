import React from 'react';
import { Button } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

type Props = {
  onFileSelect: (file: any) => void;
};

const FileUploader: React.FC<Props> = ({ onFileSelect }) => {
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets && result.assets.length > 0) {
      onFileSelect(result.assets[0]);
    }
  };

  return (
    <Button mode="outlined" onPress={pickDocument} style={{ marginBottom: 16 }}>
      Upload File
    </Button>
  );
};

export default FileUploader;
