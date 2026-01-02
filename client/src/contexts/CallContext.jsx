"use client";
import React, { createContext, useContext, useReducer } from 'react';

const CallContext = createContext();

const initialState = {
  callState: 'idle', // idle, outgoing, incoming, active
  callId: null,
  callType: null, // audio, video
  caller: null, // user object (for incoming)
  callee: null, // user object (for outgoing)
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoEnabled: true,
  error: null,
};

function callReducer(state, action) {
  switch (action.type) {
    case 'START_OUTGOING_CALL':
      return {
        ...state,
        callState: 'outgoing',
        callId: action.payload.callId,
        callType: action.payload.callType,
        callee: action.payload.callee,
        localStream: action.payload.localStream || state.localStream // Optional immediate stream set
      };
    case 'INCOMING_CALL':
      return {
        ...state,
        callState: 'incoming',
        callId: action.payload.callId,
        callType: action.payload.callType,
        caller: action.payload.caller,
      };
    case 'CALL_ACCEPTED':
      return {
        ...state,
        callState: 'active',
      };
    case 'SET_LOCAL_STREAM':
      return {
        ...state,
        localStream: action.payload,
      };
    case 'SET_REMOTE_STREAM':
      return {
        ...state,
        remoteStream: action.payload,
      };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'TOGGLE_VIDEO':
      return { ...state, isVideoEnabled: !state.isVideoEnabled };
    case 'END_CALL':
      return { ...initialState, error: action.payload?.error || null }; // Reset to idle
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function CallProvider({ children }) {
  const [state, dispatch] = useReducer(callReducer, initialState);

  return (
    <CallContext.Provider value={{ state, dispatch }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
