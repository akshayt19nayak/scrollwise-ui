import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { PaperProvider, Card, Title, Paragraph, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

interface BookmarkWithSummary extends Bookmark {
  summary?: string;
  isLoadingSummary?: boolean;
}

interface TagWithBookmarks extends Tag {
  bookmarks: BookmarkWithSummary[];
}

const StatusMessage = ({ message }: { message: string }) => (
  <View style={styles.container}>
    <Text style={styles.statusText}>{message}</Text>
  </View>
);

export default function TagsPage() {
  const { tagId } = useLocalSearchParams();
  const router = useRouter();
  const [tags, setTags] = useState<TagWithBookmarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<TagWithBookmarks[]>([]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await api.getTags();
        
        if (tagId) {
          // If tagId is provided, only show bookmarks for that tag
          const bookmarksData = await api.getBookmarksByTag(Number(tagId));
          const tag = tagsData.find((t: Tag) => t.id === Number(tagId));
          if (tag) {
            const bookmarksWithSummary = bookmarksData.map((bookmark: Bookmark) => ({
              ...bookmark,
              summary: undefined,
              isLoadingSummary: false
            }));
            
            setTags([{
              ...tag,
              bookmarks: bookmarksWithSummary
            }]);
            setFilteredTags([{
              ...tag,
              bookmarks: bookmarksWithSummary
            }]);
          }
        } else {
          // Otherwise show all tags with their bookmarks
          const bookmarksData = await api.getAllBookmarks();
          
          // Group bookmarks by tags
          const bookmarksByTag = new Map<number, BookmarkWithSummary[]>();
          bookmarksData.forEach((bookmark: Bookmark) => {
            bookmark.tags?.forEach((tag: Tag) => {
              const tagBookmarks = bookmarksByTag.get(tag.id) || [];
              tagBookmarks.push({
                ...bookmark,
                summary: undefined,
                isLoadingSummary: false
              });
              bookmarksByTag.set(tag.id, tagBookmarks);
            });
          });

          // Create tag objects with their bookmarks
          const tagsWithBookmarks = tagsData.map((tag: Tag) => ({
            ...tag,
            bookmarks: bookmarksByTag.get(tag.id) || []
          }));

          setTags(tagsWithBookmarks);
          setFilteredTags(tagsWithBookmarks);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, [tagId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTags(tags);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tags.map(tag => {
      // Filter bookmarks within each tag
      const filteredBookmarks = tag.bookmarks.filter(bookmark => {
        const titleMatch = bookmark.title?.toLowerCase().includes(query);
        const textMatch = bookmark.text.toLowerCase().includes(query);
        const collectionMatch = bookmark.collection_name?.toLowerCase().includes(query);
        
        return titleMatch || textMatch || collectionMatch;
      });
      
      // Return a new tag object with only the filtered bookmarks
      return {
        ...tag,
        bookmarks: filteredBookmarks
      };
    }).filter(tag => 
      // Keep tags that either match by name or have matching bookmarks
      tag.name.toLowerCase().includes(query) || tag.bookmarks.length > 0
    );
    
    setFilteredTags(filtered);
  }, [searchQuery, tags]);

  const handleBookmarkClick = async (bookmark: BookmarkWithSummary) => {
    // Update the loading state for this bookmark
    setTags(prev => 
      prev.map(tag => ({
        ...tag,
        bookmarks: tag.bookmarks.map(b => 
          b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
        )
      }))
    );
    
    setFilteredTags(prev => 
      prev.map(tag => ({
        ...tag,
        bookmarks: tag.bookmarks.map(b => 
          b.id === bookmark.id ? { ...b, isLoadingSummary: true } : b
        )
      }))
    );

    try {
      const response = await api.getSummary(bookmark.text);
      
      // Update the tags with the summary
      setTags(prev => 
        prev.map(tag => ({
          ...tag,
          bookmarks: tag.bookmarks.map(b => 
            b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
          )
        }))
      );
      
      setFilteredTags(prev => 
        prev.map(tag => ({
          ...tag,
          bookmarks: tag.bookmarks.map(b => 
            b.id === bookmark.id ? { ...b, summary: response.summary, isLoadingSummary: false } : b
          )
        }))
      );
    } catch (err: any) {
      console.error('Error getting summary:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to generate summary.'
      );
      
      // Reset the loading state
      setTags(prev => 
        prev.map(tag => ({
          ...tag,
          bookmarks: tag.bookmarks.map(b => 
            b.id === bookmark.id ? { ...b, isLoadingSummary: false } : b
          )
        }))
      );
      
      setFilteredTags(prev => 
        prev.map(tag => ({
          ...tag,
          bookmarks: tag.bookmarks.map(b => 
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
          {filteredTags.length === 0 ? (
            <Text style={styles.statusText}>
              {searchQuery ? 'No tags or bookmarks found matching your search' : 'No tags yet'}
            </Text>
          ) : (
            filteredTags.map((tag: TagWithBookmarks) => (
              <Card key={tag.id} style={styles.tagCard}>
                <Card.Title title={tag.name} />
                <Card.Content>
                  {tag.bookmarks.length === 0 ? (
                    <Text style={styles.statusText}>No bookmarks with this tag</Text>
                  ) : (
                    tag.bookmarks.map((bookmark: BookmarkWithSummary) => (
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
                                  textColor="#ffffff"
                                >
                                  {bookmark.collection_name}
                                </Button>
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
  collectionButton: {
    marginRight: 8,
  },
  statusText: {
    textAlign: 'center',
    color: '#ffffff',
    marginTop: 32,
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