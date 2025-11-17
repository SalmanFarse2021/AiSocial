'use client';

import React from 'react';
import { useCall } from '@/contexts/CallContext';
import IncomingCall from './IncomingCall';
import CallWindow from './CallWindow';

const CallManager = () => {
  const { incomingCall, isCallActive } = useCall();

  return (
    <>
      {/* Show incoming call notification */}
      {incomingCall && !isCallActive && <IncomingCall />}
      
      {/* Show active call window */}
      {isCallActive && <CallWindow />}
    </>
  );
};

export default CallManager;
