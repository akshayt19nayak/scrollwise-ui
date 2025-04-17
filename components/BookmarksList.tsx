import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

interface Tag {
  id: number;
  name: string;
}

interface Collection {
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
  tags?: Tag[];
}

interface BookmarkWithSummary extends Bookmark {
  summary?: string;
  isLoadingSummary?: boolean;
}

const StatusMessage = ({ message }: { message: string }) => (
  <View style={styles.container}>
    <Text style={styles.statusText}>{message}</Text>
  </View>
);

export default function BookmarksList() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkWithSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const data = await api.getAllBookmarks();
        setBookmarks(data);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  const handleBookmarkClick = async (bookmark: BookmarkWithSummary) => {
    setBookmarks(prev =>
      prev.map(b =>
        b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
      )
    );

    try {
      const response = await api.getSummary(bookmark.text);
      setBookmarks(prev =>
        prev.map(b =>
          b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
        )
      );
    } catch (err: any) {
      console.error('Error getting summary:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to generate summary.'
      );
      setBookmarks(prev =>
        prev.map(b =>
          b.id === bookmark.id ? { ...b, isLoadingSummary: false } : b
        )
      );
    }
  };

  const navigateToCollections = () => {
    router.push('/collections');
  };

  if (loading) return <StatusMessage message="Loading bookmarks..." />;

  return (
    <ScrollView style={styles.container}>
      {bookmarks.length === 0 ? (
        <Text style={styles.statusText}>No bookmarks yet</Text>
      ) : (
        bookmarks.map((bookmark) => (
          <TouchableOpacity
            key={bookmark.id}
            onPress={() => handleBookmarkClick(bookmark)}
          >
            <Card style={styles.card}>
              <Card.Content>
                <Title>
                  {bookmark.title ? bookmark.title : `Bookmark #${bookmark.id}`}
                </Title>
                <Paragraph>{bookmark.text}</Paragraph>
                
                {/* Collection display */}
                {bookmark.collection_name && (
                  <View style={styles.metadataContainer}>
                    <Text style={styles.metadataLabel}>Collection:</Text>
                    <Button 
                      mode="outlined"
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/collections',
                          params: { collectionId: bookmark.collection_id }
                        });
                      }}
                      style={styles.collectionButton}
                    >
                      {bookmark.collection_name}
                    </Button>
                  </View>
                )}
                
                {/* Tags display */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <View style={styles.metadataContainer}>
                    <Text style={styles.metadataLabel}>Tags:</Text>
                    <View style={styles.tagsContainer}>
                      {bookmark.tags.map(tag => (
                        <Button
                          key={tag.id}
                          mode="outlined"
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/tags',
                              params: { tagId: tag.id }
                            });
                          }}
                          style={styles.tagButton}
                        >
                          {tag.name}
                        </Button>
                      ))}
                    </View>
                  </View>
                )}
                
                <Paragraph style={styles.timestamp}>
                  {new Date(bookmark.created_at).toLocaleString()}
                </Paragraph>
                {bookmark.isLoadingSummary && (
                  <View style={styles.summaryContainer}>
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator />
                      <Text style={styles.loadingText}>Generating summary...</Text>
                    </View>
                  </View>
                )}
                {bookmark.summary && (
                  <View style={styles.summaryContainer}>
                    <Title style={styles.summaryTitle}>Summary</Title>
                    <Paragraph style={styles.summaryText}>{bookmark.summary}</Paragraph>
                  </View>
                )}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
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
  statusText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
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
  summaryText: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collectionButton: {
    marginRight: 8,
  },
  tagButton: {
    margin: 4,
  },
}); 