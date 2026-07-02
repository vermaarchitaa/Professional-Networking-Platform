import { createSlice } from "@reduxjs/toolkit";
import { loginUser, registerUser } from "@/config/redux/action/authAction";

const initialState = {
    user: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    loggedIn: false,
    message: "",
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: () => initialState,
        logout: () => {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
            }
            return initialState;
        },
        setLoggedIn: (state, action) => {
            state.loggedIn = action.payload;
        },
        emptyMessage: (state) => {
            state.message = "";
        }
    },

    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            state.isLoading = true
            state.message = "Knocking the door..."
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = true;
            state.loggedIn = true;
            state.message = { message: "Login successful" };
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload
        })
        .addCase(registerUser.pending, (state) => {
            state.isLoading = true
            state.message = "Registering you..."            
        })
        .addCase(registerUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = true;
            state.loggedIn = false;
            state.message = {
                message: "Registration is Successfull, Please login"
            }
        })
        .addCase(registerUser.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload
        })
    }
})

export const { reset, emptyMessage, logout, setLoggedIn } = authSlice.actions;

export default authSlice.reducer
