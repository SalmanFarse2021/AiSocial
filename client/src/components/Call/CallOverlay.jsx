"use client";
import React, { useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
import { useCallSocket } from '@/hooks/useCallSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import IncomingCall from './IncomingCall';
import OutgoingCall from './OutgoingCall';
import ActiveCall from './ActiveCall';

const CallOverlay = () => {
    const { state } = useCall();
    const { callState, callType } = state;

    // Initialize Socket Listeners
    useCallSocket();

    // Initialize WebRTC logic
    const { startCall, answerCall } = useWebRTC();

    // Audio refs
    const audioRef = React.useRef(null);
    const oscillatorRef = React.useRef(null);

    // Initial audio setup
    useEffect(() => {
        audioRef.current = new Audio();
    }, []);

    // Handle Sound Effects
    useEffect(() => {
        const stopAudio = () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (oscillatorRef.current) {
                try {
                    oscillatorRef.current.stop();
                    oscillatorRef.current.disconnect();
                } catch (e) { }
                oscillatorRef.current = null;
            }
        };

        const playRingback = () => {
            // Try MP3 first, fallback to Web Audio API
            const audio = audioRef.current;
            if (audio) {
                audio.src = '/sounds/ringback.mp3';
                audio.loop = true;
                const playPromise = audio.play();

                playPromise.catch(() => {
                    console.log('MP3 missing/failed, using Web Audio API for ringback');
                    // Fallback to synth sound
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        const ctx = new AudioContext();

                        // Standard North American Ringback: 440Hz + 480Hz
                        const osc1 = ctx.createOscillator();
                        const osc2 = ctx.createOscillator();
                        const gain = ctx.createGain();

                        osc1.type = 'sine';
                        osc2.type = 'sine';

                        osc1.frequency.setValueAtTime(440, ctx.currentTime);
                        osc2.frequency.setValueAtTime(480, ctx.currentTime);

                        // Mixed volume
                        osc1.connect(gain);
                        osc2.connect(gain);
                        gain.connect(ctx.destination);

                        osc1.start();
                        osc2.start();

                        // Ringback cadence: 2s ON, 4s OFF
                        const cycle = 6;
                        const onDuration = 2;

                        const scheduleRing = (startTime) => {
                            // Soft attack
                            gain.gain.setValueAtTime(0, startTime);
                            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
                            // Sustain
                            gain.gain.setValueAtTime(0.1, startTime + onDuration - 0.1);
                            // Soft release
                            gain.gain.linearRampToValueAtTime(0, startTime + onDuration);
                        };

                        // Schedule first ring immediately
                        const now = ctx.currentTime;
                        scheduleRing(now);

                        // Schedule future rings
                        const pulseLink = setInterval(() => {
                            if (ctx.state === 'closed') { clearInterval(pulseLink); return; }
                            // Look ahead and schedule next ring
                            scheduleRing(ctx.currentTime + 0.1);
                        }, cycle * 1000); // Every 6 seconds

                        oscillatorRef.current = {
                            stop: () => {
                                clearInterval(pulseLink);
                                try {
                                    osc1.stop();
                                    osc2.stop();
                                    ctx.close();
                                } catch (e) { }
                            }, disconnect: () => { }
                        };

                    } catch (e) {
                        console.error('Web Audio API failed', e);
                    }
                });
            }
        };

        if (callState === 'incoming') {
            if (audioRef.current) {
                audioRef.current.src = '/sounds/ringtone.mp3';
                audioRef.current.loop = true;
                audioRef.current.play().catch(console.error);
            }
        } else if (callState === 'outgoing') {
            playRingback();
        } else {
            stopAudio();
        }

        return () => {
            stopAudio();
        };
    }, [callState]);

    // Auto-start WebRTC when state changes
    useEffect(() => {
        if (callState === 'outgoing') {
            startCall();
        } else if (callState === 'active' && !state.localStream) {
            // If we transitioned to active (e.g. accepted), we ensure answer logic runs if not already started
            // But for Caller, startCall() already ran.
            // For Callee, we need to run answerCall() when they Accept.
        }
    }, [callState, startCall]);

    // Wait, the hook `useWebRTC` exposes startCall/answerCall.
    // We should trigger answerCall ONLY when user clicks Accept in IncomingCall?
    // Actually, IncomingCall component handles dispatch('CALL_ACCEPTED').
    // So we can detect transition here.

    // Refined Logic:
    // Caller: clicks Call -> dispatch(OUTGOING) -> Effect triggers startCall()
    // Callee: gets RINGING -> clicks Accept -> dispatch(ACTIVE) -> Effect triggers answerCall()

    useEffect(() => {
        // If we just became active and we were incoming, run answerCall
        // Wait, we don't have previous state easily here without ref.
        // But startCall is for Caller (OUTGOING).
        // answerCall is for Callee (INCOMING -> ACTIVE).

        // Note: Caller also goes OUTGOING -> ACTIVE. We don't want to run answerCall then.
        // We can check if we have a remote offer? Or just rely on component logic?
        // Better: Explicitly call answerCall() in IncomingCall.jsx? 
        // No, keeping logic in the hook/overlay is cleaner.

        // Let's rely on the fact that for Caller, startCall() sets up the PC.
        // For Callee, they accept, state becomes ACTIVE.
        // But wait, Caller is 'active' too once Callee answers.

        // Actually, simpler:
        // Caller creates offer immediately upon 'outgoing'.
        // Callee creates answer upon 'accept'.

    }, []);

    if (callState === 'idle') return null;

    return (
        <>
            {callState === 'incoming' && <IncomingCall onAnswer={answerCall} />}
            {callState === 'outgoing' && <OutgoingCall />}
            {callState === 'active' && <ActiveCall />}
        </>
    );
};

export default CallOverlay;
