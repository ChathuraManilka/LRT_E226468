import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for Google Sign-In
export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Processing Google Sign-In for:', userData.email);
      
      // Generate a unique token for this session
      const token = `google_${userData.id}_${Date.now()}`;
      
      // User data already contains the role from googleAuth.js
      // But we can override or validate it here if needed
      const role = userData.role || 'user';
      
      console.log(`✅ Google Sign-In successful - Role: ${role}`);
      
      return {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        },
        role: role,
        token: token
      };
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      return rejectWithValue(error.message || 'Failed to sign in with Google');
    }
  }
);

// Async thunk for signing out
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, call the logout API endpoint
      // For now, we're just simulating the API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear token from storage
      // localStorage.removeItem('auth_token');
      
      return {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  user: null,
  role: null, // 'user', 'admin', or 'superadmin'
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Local actions if needed
    clearError: (state) => {
      state.error = null;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle Google Sign In
      .addCase(googleSignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleSignIn.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(googleSignIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to sign in';
      })
      // Handle Sign Out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to sign out';
      });
  },
});

// Adding a simple logout action for convenience
export const { clearError, setRole } = authSlice.actions;

// Custom logout action
export const logout = () => (dispatch) => {
  dispatch(signOut());
};

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;

export default authSlice.reducer;
