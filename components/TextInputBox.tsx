import React from 'react';
import { TextInput } from 'react-native-paper';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

const TextInputBox: React.FC<Props> = ({ value, onChangeText }) => {
  return (
    <TextInput
      label="Enter text"
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      style={{ marginBottom: 16 }}
    />
  );
};

export default TextInputBox;