import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PaperProvider, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';

interface Tag {
  id: number;
  name: string;
}

interface Bookmark {
  id: number;
  text: string;
  title?: string;
  collection_id?: number;
  collection_name?: string;
  created_at: string;
  tags: Tag[];
}

interface Collection {
  id: number;
  name: string;
  bookmarks: Bookmark[];
}

export default function CollectionsPage() {
  const { collectionId } = useLocalSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const collectionsData = await api.getCollections();
        
        if (collectionId) {
          // If collectionId is provided, only show bookmarks for that collection
          const bookmarksData = await api.getBookmarksByCollection(Number(collectionId));
          const collection = collectionsData.find((c: Collection) => c.id === Number(collectionId));
          if (collection) {
            setCollections([{
              ...collection,
              bookmarks: bookmarksData
            }]);
          }
        } else {
          // Otherwise show all collections with their bookmarks
          const bookmarksData = await api.getAllBookmarks();
          
          // Group bookmarks by collection
          const bookmarksByCollection = new Map<number, Bookmark[]>();
          bookmarksData.forEach((bookmark: Bookmark) => {
            if (bookmark.collection_id) {
              const collectionBookmarks = bookmarksByCollection.get(bookmark.collection_id) || [];
              collectionBookmarks.push(bookmark);
              bookmarksByCollection.set(bookmark.collection_id, collectionBookmarks);
            }
          });

          // Create collection objects with their bookmarks
          const collectionsWithBookmarks = collectionsData.map((collection: { id: number; name: string }) => ({
            ...collection,
            bookmarks: bookmarksByCollection.get(collection.id) || []
          }));

          setCollections(collectionsWithBookmarks);
        }
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [collectionId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView style={styles.container}>
        {collections.map((collection: Collection) => (
          <Card key={collection.id} style={styles.collectionCard}>
            <Card.Title title={collection.name} />
            <Card.Content>
              {collection.bookmarks.map((bookmark: Bookmark) => (
                <Card key={bookmark.id} style={styles.bookmarkCard}>
                  <Card.Title 
                    title={bookmark.title || `Bookmark #${bookmark.id}`}
                    subtitle={new Date(bookmark.created_at).toLocaleDateString()}
                  />
                  <Card.Content>
                    <Text style={styles.bookmarkText}>{bookmark.text}</Text>
                    <View style={styles.tagsContainer}>
                      {bookmark.tags?.map((tag: Tag) => (
                        <Chip key={tag.id} style={styles.tag}>
                          {tag.name}
                        </Chip>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionCard: {
    marginBottom: 16,
  },
  bookmarkCard: {
    marginBottom: 8,
  },
  bookmarkText: {
    marginBottom: 8,
    color: '#ffffff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginRight: 8,
    backgroundColor: '#333333',
  },
}); 