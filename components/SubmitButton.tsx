import React from 'react';
import { Button } from 'react-native-paper';

type Props = {
  onPress: () => void;
  disabled?: boolean; 
};

const SubmitButton: React.FC<Props> = ({ onPress, disabled = false }) => {
  return (
    <Button 
      mode="contained" 
      onPress={onPress} 
      disabled={disabled} 
    >
      Submit
    </Button>
  );
};

export default SubmitButton;
