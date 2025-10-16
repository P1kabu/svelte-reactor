/**
 * Async Actions Helper tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReactor } from '../src/core/reactor.svelte';
import { asyncActions } from '../src/helpers/async-actions';

interface User {
  id: number;
  name: string;
}

interface StoreState {
  users: User[];
  loading: boolean;
  error: Error | null;
}

describe('asyncActions', () => {
  let store: ReturnType<typeof createReactor<StoreState>>;

  beforeEach(() => {
    store = createReactor({
      users: [],
      loading: false,
      error: null,
    });
  });

  describe('Basic functionality', () => {
    it('should set loading state before async operation', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          expect(store.state.loading).toBe(true);
          return { users: [{ id: 1, name: 'John' }] };
        },
      });

      await api.fetchUsers();
    });

    it('should clear loading state after successful operation', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          return { users: [{ id: 1, name: 'John' }] };
        },
      });

      await api.fetchUsers();
      expect(store.state.loading).toBe(false);
    });

    it('should update state with result', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          return { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] };
        },
      });

      await api.fetchUsers();
      expect(store.state.users).toHaveLength(2);
      expect(store.state.users[0].name).toBe('John');
    });

    it('should clear error on successful operation', async () => {
      store.state.error = new Error('Previous error');

      const api = asyncActions(store, {
        fetchUsers: async () => {
          return { users: [] };
        },
      });

      await api.fetchUsers();
      expect(store.state.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should set error state on failure', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          throw new Error('Network error');
        },
      });

      await expect(api.fetchUsers()).rejects.toThrow('Network error');
      expect(store.state.error).toBeInstanceOf(Error);
      expect(store.state.error?.message).toBe('Network error');
    });

    it('should clear loading state on error', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          throw new Error('Failed');
        },
      });

      await expect(api.fetchUsers()).rejects.toThrow();
      expect(store.state.loading).toBe(false);
    });

    it('should convert non-Error throws to Error', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          throw 'String error';
        },
      });

      await expect(api.fetchUsers()).rejects.toThrow();
      expect(store.state.error).toBeInstanceOf(Error);
      expect(store.state.error?.message).toBe('String error');
    });
  });

  describe('With parameters', () => {
    it('should pass parameters to async action', async () => {
      const api = asyncActions(store, {
        createUser: async (name: string, age: number) => {
          const newUser = { id: Date.now(), name };
          return { users: [...store.state.users, newUser] };
        },
      });

      await api.createUser('Alice', 25);
      expect(store.state.users).toHaveLength(1);
      expect(store.state.users[0].name).toBe('Alice');
    });

    it('should work with multiple parameters', async () => {
      const api = asyncActions(store, {
        updateUser: async (id: number, updates: Partial<User>) => {
          const users = store.state.users.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          );
          return { users };
        },
      });

      store.state.users = [{ id: 1, name: 'John' }];
      await api.updateUser(1, { name: 'Johnny' });
      expect(store.state.users[0].name).toBe('Johnny');
    });
  });

  describe('Custom options', () => {
    it('should use custom loading key', async () => {
      interface CustomState {
        data: any[];
        isLoading: boolean;
        error: Error | null;
      }

      const customStore = createReactor<CustomState>({
        data: [],
        isLoading: false,
        error: null,
      });

      const api = asyncActions(
        customStore,
        {
          fetchData: async () => {
            expect(customStore.state.isLoading).toBe(true);
            return { data: [1, 2, 3] };
          },
        },
        { loadingKey: 'isLoading' }
      );

      await api.fetchData();
      expect(customStore.state.isLoading).toBe(false);
    });

    it('should use custom error key', async () => {
      interface CustomState {
        data: any[];
        loading: boolean;
        lastError: Error | null;
      }

      const customStore = createReactor<CustomState>({
        data: [],
        loading: false,
        lastError: null,
      });

      const api = asyncActions(
        customStore,
        {
          fetchData: async () => {
            throw new Error('Custom error');
          },
        },
        { errorKey: 'lastError' }
      );

      await expect(api.fetchData()).rejects.toThrow();
      expect(customStore.state.lastError).toBeInstanceOf(Error);
      expect(customStore.state.lastError?.message).toBe('Custom error');
    });

    it('should use custom action prefix', async () => {
      const api = asyncActions(
        store,
        {
          fetchUsers: async () => ({ users: [] }),
        },
        { actionPrefix: 'api' }
      );

      await api.fetchUsers();
      // Action names should be api:fetchUsers:start, api:fetchUsers:success
    });

    it('should not reset error on start if resetErrorOnStart is false', async () => {
      const existingError = new Error('Existing error');
      store.state.error = existingError;

      const api = asyncActions(
        store,
        {
          fetchUsers: async () => {
            // Error should still be there at start
            expect(store.state.error).toBe(existingError);
            return { users: [] };
          },
        },
        { resetErrorOnStart: false }
      );

      await api.fetchUsers();
      // Error should be cleared on success
      expect(store.state.error).toBeNull();
    });
  });

  describe('Multiple actions', () => {
    it('should support multiple async actions', async () => {
      const api = asyncActions(store, {
        fetchUsers: async () => {
          return { users: [{ id: 1, name: 'John' }] };
        },
        createUser: async (name: string) => {
          const newUser = { id: Date.now(), name };
          return { users: [...store.state.users, newUser] };
        },
        deleteUser: async (id: number) => {
          const users = store.state.users.filter((u) => u.id !== id);
          return { users };
        },
      });

      await api.fetchUsers();
      expect(store.state.users).toHaveLength(1);

      await api.createUser('Jane');
      expect(store.state.users).toHaveLength(2);

      await api.deleteUser(1);
      expect(store.state.users).toHaveLength(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle API fetch scenario', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve([{ id: 1, name: 'User 1' }]),
        } as Response)
      );

      const api = asyncActions(store, {
        fetchUsers: async () => {
          const response = await fetch('/api/users');
          const users = await response.json();
          return { users };
        },
      });

      await api.fetchUsers();
      expect(store.state.users).toHaveLength(1);
      expect(store.state.loading).toBe(false);
      expect(store.state.error).toBeNull();
    });

    it('should handle API error scenario', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const api = asyncActions(store, {
        fetchUsers: async () => {
          const response = await fetch('/api/users');
          const users = await response.json();
          return { users };
        },
      });

      await expect(api.fetchUsers()).rejects.toThrow('Network error');
      expect(store.state.loading).toBe(false);
      expect(store.state.error?.message).toBe('Network error');
    });

    it('should handle sequential operations', async () => {
      let callCount = 0;

      const api = asyncActions(store, {
        loadData: async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { users: [{ id: callCount, name: `User ${callCount}` }] };
        },
      });

      await api.loadData();
      await api.loadData();
      await api.loadData();

      expect(callCount).toBe(3);
      expect(store.state.users[0].name).toBe('User 3');
    });
  });

  describe('Edge cases', () => {
    it('should handle action returning null', async () => {
      const api = asyncActions(store, {
        noop: async () => null,
      });

      await api.noop();
      expect(store.state.loading).toBe(false);
    });

    it('should handle action returning undefined', async () => {
      const api = asyncActions(store, {
        noop: async () => undefined,
      });

      await api.noop();
      expect(store.state.loading).toBe(false);
    });

    it('should handle action returning primitive', async () => {
      const api = asyncActions(store, {
        getValue: async () => 42,
      });

      const result = await api.getValue();
      expect(result).toBe(42);
    });
  });

  describe('Advanced complexity tests', () => {
    it('should handle concurrent async operations correctly', async () => {
      // Test that multiple concurrent operations don't interfere with each other
      interface ComplexState {
        users: User[];
        posts: Array<{ id: number; title: string }>;
        comments: Array<{ id: number; text: string }>;
        loading: boolean;
        error: Error | null;
      }

      const complexStore = createReactor<ComplexState>({
        users: [],
        posts: [],
        comments: [],
        loading: false,
        error: null,
      });

      let usersLoadingState = false;
      let postsLoadingState = false;
      let commentsLoadingState = false;

      const api = asyncActions(complexStore, {
        fetchUsers: async () => {
          usersLoadingState = complexStore.state.loading;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] };
        },
        fetchPosts: async () => {
          postsLoadingState = complexStore.state.loading;
          await new Promise((resolve) => setTimeout(resolve, 30));
          return { posts: [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }] };
        },
        fetchComments: async () => {
          commentsLoadingState = complexStore.state.loading;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return { comments: [{ id: 1, text: 'Comment 1' }] };
        },
      });

      // Execute all operations concurrently
      const results = await Promise.all([
        api.fetchUsers(),
        api.fetchPosts(),
        api.fetchComments(),
      ]);

      // Verify all operations had loading state
      expect(usersLoadingState).toBe(true);
      expect(postsLoadingState).toBe(true);
      expect(commentsLoadingState).toBe(true);

      // Verify all data was loaded correctly
      expect(complexStore.state.users).toHaveLength(2);
      expect(complexStore.state.posts).toHaveLength(2);
      expect(complexStore.state.comments).toHaveLength(1);

      // Verify loading is cleared after all operations
      expect(complexStore.state.loading).toBe(false);
      expect(complexStore.state.error).toBeNull();
    });

    it('should handle race conditions with rapid sequential calls', async () => {
      // Test rapid sequential calls to ensure state consistency
      let callCounter = 0;
      const callOrder: number[] = [];

      const api = asyncActions(store, {
        rapidFetch: async (delay: number) => {
          const thisCall = ++callCounter;
          callOrder.push(thisCall);

          await new Promise((resolve) => setTimeout(resolve, delay));

          // Simulate different response times
          const users = [{ id: thisCall, name: `User from call ${thisCall}` }];
          return { users };
        },
      });

      // Make rapid calls with different delays (last call finishes first)
      const promise1 = api.rapidFetch(100); // Slowest
      const promise2 = api.rapidFetch(50);  // Medium
      const promise3 = api.rapidFetch(10);  // Fastest

      await Promise.all([promise1, promise2, promise3]);

      // Verify all calls were made
      expect(callOrder).toEqual([1, 2, 3]);

      // The last promise to resolve should have set the final state
      // Since promise3 resolves first but we're waiting for all, the final state
      // could be from any of them. What matters is that loading is false and no errors.
      expect(store.state.loading).toBe(false);
      expect(store.state.error).toBeNull();
      expect(store.state.users).toHaveLength(1);
    });

    it('should handle complex nested operations with error recovery', async () => {
      // Test complex scenario: fetch users, then for each user fetch their profile,
      // with error handling and retry logic
      interface ProfileState {
        users: User[];
        profiles: Map<number, { bio: string; avatar: string }>;
        loading: boolean;
        error: Error | null;
        retryCount: number;
      }

      const profileStore = createReactor<ProfileState>({
        users: [],
        profiles: new Map(),
        loading: false,
        error: null,
        retryCount: 0,
      });

      let fetchUsersCallCount = 0;
      let fetchProfileCallCount = 0;
      const profileAttempts = new Map<number, number>();

      const api = asyncActions(profileStore, {
        fetchUsers: async () => {
          fetchUsersCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 20));

          if (fetchUsersCallCount === 1) {
            // First call fails
            throw new Error('Initial fetch failed');
          }

          return {
            users: [
              { id: 1, name: 'John' },
              { id: 2, name: 'Jane' },
              { id: 3, name: 'Bob' },
            ],
          };
        },

        fetchProfile: async (userId: number) => {
          fetchProfileCallCount++;
          const attempts = (profileAttempts.get(userId) || 0) + 1;
          profileAttempts.set(userId, attempts);

          await new Promise((resolve) => setTimeout(resolve, 10));

          // Simulate occasional failures on first attempt for user 2
          if (userId === 2 && attempts === 1) {
            throw new Error(`Profile fetch failed for user ${userId}`);
          }

          const newProfiles = new Map(profileStore.state.profiles);
          newProfiles.set(userId, {
            bio: `Bio for user ${userId}`,
            avatar: `avatar_${userId}.jpg`,
          });

          return { profiles: newProfiles };
        },

        retryFetch: async () => {
          const retryCount = profileStore.state.retryCount + 1;

          try {
            await api.fetchUsers();
            return { retryCount };
          } catch (error) {
            return { retryCount };
          }
        },
      });

      // First attempt - should fail
      try {
        await api.fetchUsers();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(profileStore.state.error?.message).toBe('Initial fetch failed');
        expect(profileStore.state.loading).toBe(false);
      }

      // Retry - should succeed
      await api.retryFetch();
      expect(profileStore.state.users).toHaveLength(3);
      expect(profileStore.state.retryCount).toBe(1);
      expect(profileStore.state.error).toBeNull();

      // Fetch profiles for all users
      const profilePromises = profileStore.state.users.map((user) =>
        api.fetchProfile(user.id).catch((err) => {
          // Catch and retry failed profiles
          return api.fetchProfile(user.id);
        })
      );

      await Promise.all(profilePromises);

      // Verify all profiles were loaded
      expect(profileStore.state.profiles.size).toBe(3);
      expect(profileStore.state.profiles.get(1)?.bio).toBe('Bio for user 1');
      expect(profileStore.state.profiles.get(2)?.bio).toBe('Bio for user 2');
      expect(profileStore.state.profiles.get(3)?.bio).toBe('Bio for user 3');

      // Verify final state is clean
      expect(profileStore.state.loading).toBe(false);
      expect(profileStore.state.error).toBeNull();

      // Verify call counts
      expect(fetchUsersCallCount).toBe(2); // Initial fail + retry
      expect(fetchProfileCallCount).toBe(4); // 3 users + 1 retry for user 2
    });
  });
});
