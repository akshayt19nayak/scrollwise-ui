import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Chip, Button, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { api, saveBookmarkSummary, getBookmarkSummary } from '../services/api';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkWithSummary[]>([]);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const data = await api.getAllBookmarks();
        setBookmarks(data);
        setFilteredBookmarks(data);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBookmarks(bookmarks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = bookmarks.filter(bookmark => {
      const titleMatch = bookmark.title?.toLowerCase().includes(query);
      const textMatch = bookmark.text.toLowerCase().includes(query);
      const collectionMatch = bookmark.collection_name?.toLowerCase().includes(query);
      const tagMatch = bookmark.tags?.some(tag => tag.name.toLowerCase().includes(query));
      
      return titleMatch || textMatch || collectionMatch || tagMatch;
    });
    
    setFilteredBookmarks(filtered);
  }, [searchQuery, bookmarks]);

  const handleBookmarkClick = async (bookmark: Bookmark) => {
    // Set loading state for this bookmark
    setBookmarks(prev => 
      prev.map(b => 
        b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
      )
    );
    setFilteredBookmarks(prev => 
      prev.map(b => 
        b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
      )
    );

    try {
      // First check if we already have a summary
      try {
        const savedSummary = await getBookmarkSummary(bookmark.id);
        setSelectedBookmark(bookmark);
        setSummary(savedSummary.summary);
        
        // Update the bookmark in the list
        setBookmarks(prev => 
          prev.map(b => 
            b.id === bookmark.id ? { ...b, summary: savedSummary.summary, isLoadingSummary: false } : b
          )
        );
        setFilteredBookmarks(prev => 
          prev.map(b => 
            b.id === bookmark.id ? { ...b, summary: savedSummary.summary, isLoadingSummary: false } : b
          )
        );
        return;
      } catch (error) {
        // If no summary exists, generate and save a new one
        const response = await saveBookmarkSummary(bookmark.id);
        setSelectedBookmark(bookmark);
        setSummary(response.summary);
        
        // Update the bookmark in the list
        setBookmarks(prev => 
          prev.map(b => 
            b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
          )
        );
        setFilteredBookmarks(prev => 
          prev.map(b => 
            b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
          )
        );
      }
    } catch (error) {
      console.error('Error handling bookmark click:', error);
      Alert.alert('Error', 'Failed to generate summary');
      
      // Reset loading state on error
      setBookmarks(prev => 
        prev.map(b => 
          b.id === bookmark.id ? { ...b, isLoadingSummary: false } : b
        )
      );
      setFilteredBookmarks(prev => 
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
    <View style={styles.container}>
      <Searchbar
        placeholder="Search bookmarks..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <ScrollView>
        {filteredBookmarks.length === 0 ? (
          <Text style={styles.statusText}>
            {searchQuery ? 'No bookmarks found matching your search' : 'No bookmarks yet'}
          </Text>
        ) : (
          filteredBookmarks.map((bookmark) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
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