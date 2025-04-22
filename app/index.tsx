import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import { PaperProvider, Button, TextInput, Chip, Portal, Modal, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import TextInputBox from '../components/TextInputBox';
import FileUploader from '../components/FileUploader';
import { api, saveBookmarkSummary } from '../services/api';

interface Collection {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

export default function App() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<any>(null);
  const [isFormValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state variables for title, collections, and tags
  const [title, setTitle] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  // Modal states
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Load collections and tags on component mount
  useEffect(() => {
    loadCollections();
    loadTags();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const loadTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleUrlInput = (url: any) => {
    console.log('text is: ', url)
    setUrl(url)
    const isFormValid = url.trim() !== '' || file !== null;
    setFormValid(isFormValid)
  }

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setIsSubmitting(true);
    try {
      // First save the bookmark
      const bookmarkResponse = await api.saveBookmark(
        url,
        title,
        selectedCollectionId || undefined,
        selectedTagIds.length > 0 ? selectedTagIds : undefined
      );

      // Then save the summary
      try {
        await saveBookmarkSummary(bookmarkResponse.id);
      } catch (summaryError) {
        console.error('Failed to save summary:', summaryError);
        // Don't show error to user since bookmark was saved successfully
      }

      setUrl('');
      setTitle('');
      setSelectedCollectionId(null);
      setSelectedTagIds([]);
      Alert.alert('Success', 'Bookmark saved successfully');
    } catch (err) {
      console.error('Failed to save bookmark:', err);
      Alert.alert('Error', 'Failed to save bookmark');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBookmarks = () => {
    router.push('/bookmarks');
  };

  const createNewCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Collection name is required');
      return;
    }
    
    try {
      const result = await api.createCollection(newCollectionName);
      await loadCollections(); // Reload collections
      setNewCollectionName(''); // Clear the input
      setCollectionModalVisible(false); // Close the modal
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
      console.error('Collection creation error:', error);
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'Tag name is required');
      return;
    }
    
    try {
      const result = await api.createTag(newTagName);
      await loadTags(); // Reload tags
      setNewTagName(''); // Clear the input
      setTagModalVisible(false); // Close the modal
    } catch (error) {
      Alert.alert('Error', 'Failed to create tag');
      console.error('Tag creation error:', error);
    }
  };

  const toggleTagSelection = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  return (
    <PaperProvider>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>ScrollWise</Text>
        <View style={styles.inputSection}>
          <TextInputBox value={url} onChangeText={handleUrlInput} />
          <FileUploader onFileSelect={setFile} />
          
          {/* Title Input */}
          <TextInput
            label="Title (optional)"
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
            mode="outlined"
          />
          
          {/* Collection Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection (optional)</Text>
            <View style={styles.chipContainer}>
              {collections.map((collection) => (
                <Chip
                  key={collection.id}
                  selected={selectedCollectionId === collection.id}
                  onPress={() => setSelectedCollectionId(collection.id)}
                  style={styles.chip}
                >
                  {collection.name}
                </Chip>
              ))}
              <Chip
                onPress={() => setCollectionModalVisible(true)}
                style={styles.chip}
              >
                New Collection
              </Chip>
            </View>
          </View>
          
          {/* Tag Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (optional)</Text>
            <View style={styles.chipContainer}>
              {tags.map(tag => (
                <Chip
                  key={tag.id}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTagSelection(tag.id)}
                  style={styles.chip}
                >
                  {tag.name}
                </Chip>
              ))}
              <Chip
                icon="plus"
                onPress={() => setTagModalVisible(true)}
                style={styles.chip}
              >
                New Tag
              </Chip>
            </View>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleSubmit} 
            disabled={!isFormValid || isSubmitting} 
            style={styles.submitButton}
          >
            Submit
          </Button>
        </View>
        <View style={styles.buttonSection}>
          <Button 
            mode="contained" 
            onPress={navigateToBookmarks}
            style={styles.bookmarksButton}
          >
            View Bookmarks
          </Button>
        </View>
        
        {/* Collection Creation Modal */}
        <Portal>
          <Modal
            visible={collectionModalVisible}
            onDismiss={() => setCollectionModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Create New Collection</Text>
            <TextInput
              label="Collection Name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              style={styles.modalInput}
              mode="outlined"
            />
            <View style={styles.modalButtons}>
              <Button onPress={() => setCollectionModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={createNewCollection}>Create</Button>
            </View>
          </Modal>
        </Portal>
        
        {/* Tag Creation Modal */}
        <Portal>
          <Modal
            visible={tagModalVisible}
            onDismiss={() => setTagModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Create New Tag</Text>
            <TextInput
              label="Tag Name"
              value={newTagName}
              onChangeText={setNewTagName}
              style={styles.modalInput}
              mode="outlined"
            />
            <View style={styles.modalButtons}>
              <Button onPress={() => setTagModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={createNewTag}>Create</Button>
            </View>
          </Modal>
        </Portal>
      </ScrollView>
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
  titleInput: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  buttonSection: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  bookmarksButton: {
    marginBottom: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});