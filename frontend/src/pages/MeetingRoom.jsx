import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Info, Shield, Maximize2, Minimize2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGuestSession, getMeetingDisplayName } from '../utils/guestSession';
import { api } from '../services/api';
import { connectMeetingSignaling } from '../services/signaling';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRecording } from '../hooks/useRecording';
import VideoTile from '../components/meeting/VideoTile';
import ControlBar from '../components/meeting/ControlBar';
import ChatPanel from '../components/meeting/ChatPanel';
import ParticipantsPanel from '../components/meeting/ParticipantsPanel';
import HostToolsPanel from '../components/meeting/HostToolsPanel';
import ReactionsMenu from '../components/meeting/ReactionsMenu';
import PreJoinLobby from '../components/meeting/PreJoinLobby';

export default function MeetingRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const displayName = useMemo(
    () => location.state?.displayName || getMeetingDisplayName(user),
    [location.state?.displayName, user]
  );

  const [phase, setPhase] = useState('lobby');
  const [meeting, setMeeting] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [myPeerId, setMyPeerId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [joining, setJoining] = useState(false);

  const signalingRef = useRef(null);
  const [signalingApi, setSignalingApi] = useState(null);
  const videoAreaRef = useRef(null);
  const reactionsRef = useRef(null);

  const {
    localStream,
    audioMuted,
    videoOff,
    screenSharing,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopAll,
  } = useLocalMedia();

  const { remoteStreams, connectToExistingPeers, cleanup, removePeer, handleSignal, onPeerJoined } =
    useWebRTC({
      localStream,
      enabled: phase === 'joined',
      signaling: signalingApi,
    });

  const { isRecording, startRecording, stopRecording } = useRecording(localStream, remoteStreams);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guest = getGuestSession();
    if (!token && !guest && !user) {
      navigate(`/join/${code}`, { replace: true });
    }
  }, [code, navigate, user]);

  useEffect(() => {
    api
      .getMeetingPublic(code)
      .then(({ meeting: m }) => setMeeting(m))
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    startMedia({ audio: false, video: false });
    return () => stopAll();
  }, [code]);

  useEffect(() => {
    if (!showReactions) return;
    const onMouseDown = (e) => {
      if (reactionsRef.current?.contains(e.target)) return;
      if (e.target.closest('[data-reactions-trigger]')) return;
      setShowReactions(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showReactions]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const broadcastMediaState = useCallback(() => {
    signalingRef.current?.updateMediaState({ audioMuted, videoOff, screenSharing });
  }, [audioMuted, videoOff, screenSharing]);

  useEffect(() => {
    if (phase === 'joined') broadcastMediaState();
  }, [phase, audioMuted, videoOff, screenSharing, broadcastMediaState]);

  const handleSignalRef = useRef(handleSignal);
  const onPeerJoinedRef = useRef(onPeerJoined);
  const connectPeersRef = useRef(connectToExistingPeers);
  const removePeerRef = useRef(removePeer);
  handleSignalRef.current = handleSignal;
  onPeerJoinedRef.current = onPeerJoined;
  connectPeersRef.current = connectToExistingPeers;
  removePeerRef.current = removePeer;

  const enterMeeting = async () => {
    setJoining(true);
    setError('');

    try {
      if (!localStream && (!audioMuted || !videoOff)) {
        await startMedia({ audio: !audioMuted, video: !videoOff });
      }

      const guest = getGuestSession();
      const token = localStorage.getItem('token');
      const peerId = guest?.guestId || user?.id || crypto.randomUUID();

      const conn = await connectMeetingSignaling({
        meetingCode: code,
        peerId,
        displayName,
        isHost: !!(user?.id && meeting?.hostId && user.id === meeting.hostId),
        token,
        guestName: displayName,
        guestId: guest?.guestId || peerId,
        handlers: {
          onParticipants: (list) => setParticipants(list),
          onExistingPeers: (peers) => connectPeersRef.current(peers),
          onPeerJoined: (peer) => {
            setParticipants((prev) => {
              const id = peer.peerId || peer.socketId;
              if (prev.some((p) => (p.peerId || p.socketId) === id)) return prev;
              return [...prev, peer];
            });
            onPeerJoinedRef.current(peer);
          },
          onPeerLeft: ({ peerId: leftId }) => {
            setParticipants((prev) =>
              prev.filter((p) => (p.peerId || p.socketId) !== leftId)
            );
            removePeerRef.current(leftId);
          },
          onSignal: (p) => handleSignalRef.current(p),
          onChat: (msg) => setMessages((prev) => [...prev, msg]),
          onWaiting: (m) => {
            setMeeting(m);
            setPhase('waiting');
          },
          onAdmitted: () => setPhase('joined'),
          onDenied: () => {
            alert('The host denied your request to join');
            navigate('/');
          },
          onMeetingEnded: () => {
            alert('The meeting has ended');
            navigate('/');
          },
          onForceMute: () => toggleAudio(),
          onRemoved: () => {
            alert('You were removed from the meeting');
            navigate('/');
          },
        },
      });

      signalingRef.current = conn;
      setSignalingApi(conn);
      setMyPeerId(conn.peerId);
      setIsHost(!!conn.isHost);

      if (!conn.waiting) {
        setPhase('joined');
      }
    } catch (err) {
      setError(err.message || 'Failed to join meeting');
    } finally {
      setJoining(false);
    }
  };

  const handleToggleAudio = async () => {
    await toggleAudio();
    setTimeout(broadcastMediaState, 50);
  };

  const handleToggleVideo = async () => {
    await toggleVideo();
    setTimeout(broadcastMediaState, 50);
  };

  const handleToggleScreenShare = async () => {
    await toggleScreenShare();
    setTimeout(broadcastMediaState, 100);
  };

  const handleLeave = () => {
    cleanup();
    stopAll();
    signalingRef.current?.leave();
    navigate('/');
  };

  const handleEndMeeting = () => {
    signalingRef.current?.endMeeting();
    handleLeave();
  };

  const toggleFullscreen = () => {
    const el = videoAreaRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const meetingTitle = meeting?.title || `${displayName}'s Meeting`;

  const allParticipants = useMemo(() => {
    const self = {
      peerId: myPeerId,
      socketId: myPeerId,
      displayName,
      isHost,
      audioMuted,
      videoOff,
    };
    const others = participants.filter(
      (p) => (p.peerId || p.socketId) !== myPeerId
    );
    if (others.length === 0 && phase === 'joined') return [self];
    const hasSelf = participants.some(
      (p) => (p.peerId || p.socketId) === myPeerId
    );
    return hasSelf ? participants : [self, ...others];
  }, [participants, myPeerId, displayName, isHost, audioMuted, videoOff, phase]);

  const participantCount = allParticipants.length || 1;

  if (phase === 'lobby') {
    return (
      <PreJoinLobby
        displayName={displayName}
        meetingTitle={meetingTitle}
        meetingCode={code}
        previewStream={localStream}
        audioMuted={audioMuted}
        videoOff={videoOff}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onJoin={enterMeeting}
        onCancel={() => navigate(`/join/${code}`)}
        joining={joining}
        error={error}
      />
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-zoom-blue border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-medium">Waiting for the host to let you in…</h2>
          <p className="text-white/60 mt-2">{meetingTitle}</p>
        </div>
      </div>
    );
  }

  if (error && phase !== 'joined') {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="zoom-btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const remoteEntries = Array.from(remoteStreams.entries());
  const totalTiles = 1 + remoteEntries.length;
  const gridClass =
    totalTiles <= 1
      ? 'grid-cols-1 h-full'
      : totalTiles <= 4
        ? 'grid-cols-2'
        : 'grid-cols-3';

  return (
    <div className="h-screen flex flex-col bg-zoom-dark overflow-hidden">
      <header className="h-10 bg-black/80 flex items-center px-4 shrink-0 text-white text-sm z-10">
        <span className="font-semibold mr-3 opacity-80">UniMeet</span>
        <Info className="w-3.5 h-3.5 text-white/50 mr-1.5" />
        <span className="truncate flex-1">{meetingTitle}</span>
        <div className="flex items-center gap-2 ml-4">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-xs bg-zoom-blue px-2 py-0.5 rounded hidden sm:block">
            Free — No time limit
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 text-white/60 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button type="button" onClick={handleLeave} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        <main
          ref={videoAreaRef}
          className="flex-1 p-2 sm:p-4 overflow-hidden bg-black min-h-0"
        >
          <div className={`grid ${gridClass} gap-2 sm:gap-3 h-full w-full`}>
            <VideoTile
              stream={localStream}
              name={displayName}
              isLocal
              muted
              videoOff={videoOff}
              fill
            />
            {remoteEntries.map(([peerId, stream]) => {
              const participant = participants.find(
                (p) => (p.peerId || p.socketId) === peerId
              );
              return (
                <VideoTile
                  key={peerId}
                  stream={stream}
                  name={participant?.displayName || 'Participant'}
                  videoOff={participant?.videoOff}
                  fill
                />
              );
            })}
          </div>

          {floatingReaction && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 text-5xl animate-bounce z-50 pointer-events-none">
              {floatingReaction}
            </div>
          )}

          {showReactions && (
            <div ref={reactionsRef}>
              <ReactionsMenu
                onReaction={(emoji) => {
                  setFloatingReaction(emoji);
                  setTimeout(() => setFloatingReaction(null), 3000);
                  signalingRef.current?.sendChat(emoji);
                }}
                onRaiseHand={() => signalingRef.current?.sendChat('✋ Raised hand')}
                onClose={() => setShowReactions(false)}
              />
            </div>
          )}
        </main>

        {activePanel === 'chat' && (
          <ChatPanel
            messages={messages}
            onSend={(content) => signalingRef.current?.sendChat(content)}
            onClose={() => setActivePanel(null)}
            meetingTitle={meetingTitle}
          />
        )}

        {activePanel === 'participants' && (
          <ParticipantsPanel
            participants={allParticipants}
            isHost={isHost}
            mySocketId={myPeerId}
            onClose={() => setActivePanel(null)}
            onMute={(id) => signalingRef.current?.muteParticipant(id)}
            onRemove={(id) => signalingRef.current?.removeParticipant(id)}
            onMuteAll={() => {
              allParticipants.forEach((p) => {
                const id = p.peerId || p.socketId;
                if (id !== myPeerId) signalingRef.current?.muteParticipant(id);
              });
            }}
          />
        )}

        {activePanel === 'host' && isHost && (
          <HostToolsPanel
            onClose={() => setActivePanel(null)}
            onEndMeeting={() => setShowEndDialog(true)}
          />
        )}
      </div>

      <ControlBar
        audioMuted={audioMuted}
        videoOff={videoOff}
        screenSharing={screenSharing}
        participantCount={participantCount}
        activePanel={activePanel}
        isHost={isHost}
        isRecording={isRecording}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onTogglePanel={(panel) => setActivePanel(activePanel === panel ? null : panel)}
        onEnd={() => setShowEndDialog(true)}
        onEndMeeting={handleEndMeeting}
        onToggleRecording={async () => {
          if (isRecording) {
            const url = await stopRecording();
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = `unimeet-${Date.now()}.webm`;
              a.click();
            }
          } else startRecording();
        }}
        onToggleReactions={() => setShowReactions(!showReactions)}
        showReactions={showReactions}
      />

      {showEndDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Leave meeting?</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLeave}
                className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Leave meeting
              </button>
              {isHost && (
                <button
                  type="button"
                  onClick={handleEndMeeting}
                  className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  End meeting for all
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowEndDialog(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
