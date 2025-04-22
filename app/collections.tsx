import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { PaperProvider, Card, Title, Paragraph, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, saveBookmarkSummary, getBookmarkSummary } from '../services/api';

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

interface BookmarkWithSummary extends Bookmark {
  summary?: string;
  isLoadingSummary?: boolean;
}

interface Collection {
  id: number;
  name: string;
  bookmarks: BookmarkWithSummary[];
}

const StatusMessage = ({ message }: { message: string }) => (
  <View style={styles.container}>
    <Text style={styles.statusText}>{message}</Text>
  </View>
);

export default function CollectionsPage() {
  const { collectionId } = useLocalSearchParams();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const collectionsData = await api.getCollections();
        
        if (collectionId) {
          // If collectionId is provided, only show bookmarks for that collection
          const bookmarksData = await api.getBookmarksByCollection(Number(collectionId));
          const collection = collectionsData.find((c: Collection) => c.id === Number(collectionId));
          if (collection) {
            const bookmarksWithSummary = bookmarksData.map((bookmark: Bookmark) => ({
              ...bookmark,
              summary: undefined,
              isLoadingSummary: false
            }));
            
            setCollections([{
              ...collection,
              bookmarks: bookmarksWithSummary
            }]);
            setFilteredCollections([{
              ...collection,
              bookmarks: bookmarksWithSummary
            }]);
          }
        } else {
          // Otherwise show all collections with their bookmarks
          const bookmarksData = await api.getAllBookmarks();
          
          // Group bookmarks by collection
          const bookmarksByCollection = new Map<number, BookmarkWithSummary[]>();
          bookmarksData.forEach((bookmark: Bookmark) => {
            if (bookmark.collection_id) {
              const collectionBookmarks = bookmarksByCollection.get(bookmark.collection_id) || [];
              collectionBookmarks.push({
                ...bookmark,
                summary: undefined,
                isLoadingSummary: false
              });
              bookmarksByCollection.set(bookmark.collection_id, collectionBookmarks);
            }
          });

          // Create collection objects with their bookmarks
          const collectionsWithBookmarks = collectionsData.map((collection: { id: number; name: string }) => ({
            ...collection,
            bookmarks: bookmarksByCollection.get(collection.id) || []
          }));

          setCollections(collectionsWithBookmarks);
          setFilteredCollections(collectionsWithBookmarks);
        }
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [collectionId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCollections(collections);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = collections.map(collection => {
      // Filter bookmarks within each collection
      const filteredBookmarks = collection.bookmarks.filter(bookmark => {
        const titleMatch = bookmark.title?.toLowerCase().includes(query);
        const textMatch = bookmark.text.toLowerCase().includes(query);
        const tagMatch = bookmark.tags?.some(tag => tag.name.toLowerCase().includes(query));
        
        return titleMatch || textMatch || tagMatch;
      });
      
      // Return a new collection object with only the filtered bookmarks
      return {
        ...collection,
        bookmarks: filteredBookmarks
      };
    }).filter(collection => 
      // Keep collections that either match by name or have matching bookmarks
      collection.name.toLowerCase().includes(query) || collection.bookmarks.length > 0
    );
    
    setFilteredCollections(filtered);
  }, [searchQuery, collections]);

  const handleBookmarkClick = async (bookmark: BookmarkWithSummary) => {
    // Update the loading state for this bookmark
    setCollections(prev => 
      prev.map(collection => ({
        ...collection,
        bookmarks: collection.bookmarks.map(b => 
          b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
        )
      }))
    );
    
    setFilteredCollections(prev => 
      prev.map(collection => ({
        ...collection,
        bookmarks: collection.bookmarks.map(b => 
          b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
        )
      }))
    );

    try {
      // First check if we already have a summary
      try {
        const savedSummary = await getBookmarkSummary(bookmark.id);
        
        // Update the collections with the summary
        setCollections(prev => 
          prev.map(collection => ({
            ...collection,
            bookmarks: collection.bookmarks.map(b => 
              b.id === bookmark.id ? { ...b, summary: savedSummary.summary, isLoadingSummary: false } : b
            )
          }))
        );
        
        setFilteredCollections(prev => 
          prev.map(collection => ({
            ...collection,
            bookmarks: collection.bookmarks.map(b => 
              b.id === bookmark.id ? { ...b, summary: savedSummary.summary, isLoadingSummary: false } : b
            )
          }))
        );
      } catch (error) {
        // If no summary exists, generate and save a new one
        const response = await saveBookmarkSummary(bookmark.id);
        
        // Update the collections with the summary
        setCollections(prev => 
          prev.map(collection => ({
            ...collection,
            bookmarks: collection.bookmarks.map(b => 
              b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
            )
          }))
        );
        
        setFilteredCollections(prev => 
          prev.map(collection => ({
            ...collection,
            bookmarks: collection.bookmarks.map(b => 
              b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
            )
          }))
        );
      }
    } catch (err: any) {
      console.error('Error getting summary:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to generate summary.'
      );
      
      // Reset the loading state
      setCollections(prev => 
        prev.map(collection => ({
          ...collection,
          bookmarks: collection.bookmarks.map(b => 
            b.id === bookmark.id ? { ...b, isLoadingSummary: false } : b
          )
        }))
      );
      
      setFilteredCollections(prev => 
        prev.map(collection => ({
          ...collection,
          bookmarks: collection.bookmarks.map(b => 
            b.id === bookmark.id ? { ...b, isLoadingSummary: false } : b
          )
        }))
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search bookmarks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <ScrollView>
          {filteredCollections.length === 0 ? (
            <Text style={styles.statusText}>
              {searchQuery ? 'No collections or bookmarks found matching your search' : 'No collections yet'}
            </Text>
          ) : (
            filteredCollections.map((collection: Collection) => (
              <Card key={collection.id} style={styles.collectionCard}>
                <Card.Title title={collection.name} />
                <Card.Content>
                  {collection.bookmarks.length === 0 ? (
                    <Text style={styles.statusText}>No bookmarks in this collection</Text>
                  ) : (
                    collection.bookmarks.map((bookmark: BookmarkWithSummary) => (
                      <TouchableOpacity
                        key={bookmark.id}
                        onPress={() => handleBookmarkClick(bookmark)}
                      >
                        <Card style={styles.bookmarkCard}>
                          <Card.Content>
                            <Title>
                              {bookmark.title ? bookmark.title : `Bookmark #${bookmark.id}`}
                            </Title>
                            <Paragraph>{bookmark.text}</Paragraph>
                            
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
                                      textColor="#ffffff"
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
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </PaperProvider>
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
  statusText: {
    textAlign: 'center',
    color: '#ffffff',
    marginTop: 32,
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
  tagButton: {
    margin: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  loadingText: {
    marginLeft: 8,
    color: '#ffffff',
  },
}); 