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

interface TagWithBookmarks extends Tag {
  bookmarks: Bookmark[];
}

export default function TagsPage() {
  const { tagId } = useLocalSearchParams();
  const [tags, setTags] = useState<TagWithBookmarks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await api.getTags();
        
        if (tagId) {
          // If tagId is provided, only show bookmarks for that tag
          const bookmarksData = await api.getBookmarksByTag(Number(tagId));
          const tag = tagsData.find((t: Tag) => t.id === Number(tagId));
          if (tag) {
            setTags([{
              ...tag,
              bookmarks: bookmarksData
            }]);
          }
        } else {
          // Otherwise show all tags with their bookmarks
          const bookmarksData = await api.getAllBookmarks();
          
          // Group bookmarks by tags
          const bookmarksByTag = new Map<number, Bookmark[]>();
          bookmarksData.forEach((bookmark: Bookmark) => {
            bookmark.tags?.forEach((tag: Tag) => {
              const tagBookmarks = bookmarksByTag.get(tag.id) || [];
              tagBookmarks.push(bookmark);
              bookmarksByTag.set(tag.id, tagBookmarks);
            });
          });

          // Create tag objects with their bookmarks
          const tagsWithBookmarks = tagsData.map((tag: Tag) => ({
            ...tag,
            bookmarks: bookmarksByTag.get(tag.id) || []
          }));

          setTags(tagsWithBookmarks);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, [tagId]);

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
        {tags.map((tag: TagWithBookmarks) => (
          <Card key={tag.id} style={styles.tagCard}>
            <Card.Title title={tag.name} />
            <Card.Content>
              {tag.bookmarks.map((bookmark: Bookmark) => (
                <Card key={bookmark.id} style={styles.bookmarkCard}>
                  <Card.Title 
                    title={bookmark.title || `Bookmark #${bookmark.id}`}
                    subtitle={new Date(bookmark.created_at).toLocaleDateString()}
                  />
                  <Card.Content>
                    <Text style={styles.bookmarkText}>{bookmark.text}</Text>
                    {bookmark.collection_name && (
                      <View style={styles.metadataContainer}>
                        <Text style={styles.metadataLabel}>Collection:</Text>
                        <Chip style={styles.collectionChip}>
                          {bookmark.collection_name}
                        </Chip>
                      </View>
                    )}
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
  tagCard: {
    marginBottom: 16,
  },
  bookmarkCard: {
    marginBottom: 8,
  },
  bookmarkText: {
    marginBottom: 8,
    color: '#ffffff',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#ffffff',
  },
  collectionChip: {
    marginRight: 8,
    backgroundColor: '#333333',
  },
}); 