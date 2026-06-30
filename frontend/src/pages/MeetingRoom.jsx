import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Info, Shield, Grid3X3, Minimize2, Maximize2, X } from 'lucide-react';
import { getSocket, connectSocket, connectSocketAsGuest } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { getGuestSession, getMeetingDisplayName } from '../utils/guestSession';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRecording } from '../hooks/useRecording';
import VideoTile from '../components/meeting/VideoTile';
import ControlBar from '../components/meeting/ControlBar';
import ChatPanel from '../components/meeting/ChatPanel';
import ParticipantsPanel from '../components/meeting/ParticipantsPanel';
import HostToolsPanel from '../components/meeting/HostToolsPanel';
import ReactionsMenu from '../components/meeting/ReactionsMenu';

export default function MeetingRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const displayName = useMemo(
    () => location.state?.displayName || getMeetingDisplayName(user),
    [location.state?.displayName, user]
  );

  const [meeting, setMeeting] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const joinedRef = useRef(false);

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

  const { remoteStreams, connectToExistingPeers, cleanup } = useWebRTC({
    meetingCode: code,
    localStream,
    enabled: joined,
  });

  const { isRecording, startRecording, stopRecording, downloadRecording, recordingUrl } =
    useRecording(localStream, remoteStreams);

  const broadcastMediaState = useCallback(() => {
    const socket = getSocket();
    socket?.emit('media:state', { audioMuted, videoOff, screenSharing });
  }, [audioMuted, videoOff, screenSharing]);

  useEffect(() => {
    if (joined) broadcastMediaState();
  }, [joined, broadcastMediaState]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guest = getGuestSession();
    if (!token && !guest) {
      navigate(`/join/${code}`, { replace: true });
    }
  }, [code, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = localStorage.getItem('token');
        const guest = getGuestSession();
        if (!token && !guest) return;

        if (token) {
          connectSocket(token);
        } else if (guest) {
          connectSocketAsGuest(guest.displayName, guest.guestId);
        }

        await startMedia();
        const socket = getSocket();
        if (!socket) throw new Error('Not connected to server');

        setMySocketId(socket.id);

        socket.emit('room:join', { meetingCode: code }, (response) => {
          if (cancelled) return;
          if (response?.error) {
            setError(response.error);
            return;
          }
          if (response?.waiting) {
            setWaiting(true);
            setMeeting(response.meeting);
            return;
          }
          setMeeting(response.meeting);
          setIsHost(response.isHost);
          setJoined(true);
          joinedRef.current = true;
        });

        socket.on('room:joined', ({ participants: list, existingPeers }) => {
          setParticipants(list);
          connectToExistingPeers(existingPeers);
        });

        socket.on('peer:joined', (peer) => {
          setParticipants((prev) => {
            if (prev.some((p) => p.socketId === peer.socketId)) return prev;
            return [...prev, peer];
          });
        });

        socket.on('peer:left', ({ socketId }) => {
          setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
        });

        socket.on('participants:update', (list) => setParticipants(list));

        socket.on('chat:message', (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        socket.on('host:force-mute', () => {
          toggleAudio();
        });

        socket.on('host:removed', () => {
          alert('You were removed from the meeting by the host');
          navigate('/');
        });

        socket.on('waiting-room:admitted', () => {
          setWaiting(false);
          setJoined(true);
        });

        socket.on('waiting-room:denied', () => {
          alert('The host denied your request to join');
          navigate('/');
        });

        socket.on('meeting:ended', () => {
          alert('The meeting has ended');
          navigate('/');
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      cleanup();
      stopAll();
      const socket = getSocket();
      socket?.off('room:joined');
      socket?.off('peer:joined');
      socket?.off('peer:left');
      socket?.off('participants:update');
      socket?.off('chat:message');
      socket?.off('host:force-mute');
      socket?.off('host:removed');
      socket?.off('waiting-room:admitted');
      socket?.off('waiting-room:denied');
      socket?.off('meeting:ended');
    };
  }, [code, startMedia, connectToExistingPeers, cleanup, stopAll, navigate, toggleAudio]);

  const handleToggleAudio = () => {
    toggleAudio();
    setTimeout(broadcastMediaState, 50);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setTimeout(broadcastMediaState, 50);
  };

  const handleToggleScreenShare = async () => {
    await toggleScreenShare();
    setTimeout(broadcastMediaState, 100);
  };

  const handleSendChat = (content) => {
    getSocket()?.emit('chat:message', { content });
  };

  const handleMuteParticipant = (targetSocketId) => {
    getSocket()?.emit('host:mute-participant', { targetSocketId });
  };

  const handleRemoveParticipant = (targetSocketId) => {
    if (confirm('Remove this participant from the meeting?')) {
      getSocket()?.emit('host:remove-participant', { targetSocketId });
    }
  };

  const handleMuteAll = () => {
    participants.forEach((p) => {
      if (p.socketId !== mySocketId) {
        getSocket()?.emit('host:mute-participant', { targetSocketId: p.socketId });
      }
    });
  };

  const handleLeave = () => {
    cleanup();
    stopAll();
    navigate('/');
  };

  const handleEndMeeting = () => {
    getSocket()?.emit('host:end-meeting');
    handleLeave();
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const url = await stopRecording();
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `unimeet-recording-${Date.now()}.webm`;
        a.click();
      }
    } else {
      startRecording();
    }
  };

  const meetingTitle = meeting?.title || `${displayName}'s Meeting`;

  if (waiting) {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-zoom-blue border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-medium">Waiting for the host to let you in…</h2>
          <p className="text-white/60 mt-2">{meeting?.title}</p>
        </div>
      </div>
    );
  }

  if (error) {
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
      ? 'grid-cols-1 max-w-4xl mx-auto'
      : totalTiles <= 4
        ? 'grid-cols-2'
        : 'grid-cols-3';

  return (
    <div className="h-screen flex flex-col bg-zoom-dark overflow-hidden">
      {/* Top bar — Zoom dark header */}
      <header className="h-10 bg-black/80 flex items-center px-4 shrink-0 text-white text-sm">
        <span className="font-semibold mr-3 opacity-80">UniMeet</span>
        <Info className="w-3.5 h-3.5 text-white/50 mr-1.5" />
        <span className="truncate flex-1">{meetingTitle}</span>
        <div className="flex items-center gap-2 ml-4">
          <Shield className="w-4 h-4 text-green-500" />
          <button className="text-xs bg-zoom-blue px-2 py-0.5 rounded hidden sm:block">
            Free — No time limit
          </button>
          <Grid3X3 className="w-4 h-4 text-white/60" />
          <Minimize2 className="w-3.5 h-3.5 text-white/40" />
          <Maximize2 className="w-3.5 h-3.5 text-white/40" />
          <button onClick={handleLeave} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Video grid */}
        <main className="flex-1 p-4 overflow-auto">
          <div className={`grid ${gridClass} gap-3 h-full content-center`}>
            <VideoTile
              stream={localStream}
              name={displayName}
              isLocal
              muted
              videoOff={videoOff}
            />
            {remoteEntries.map(([socketId, stream]) => {
              const participant = participants.find((p) => p.socketId === socketId);
              return (
                <VideoTile
                  key={socketId}
                  stream={stream}
                  name={participant?.displayName || 'Participant'}
                  videoOff={participant?.videoOff}
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
            <ReactionsMenu
              onReaction={(emoji) => {
                setFloatingReaction(emoji);
                setTimeout(() => setFloatingReaction(null), 3000);
                getSocket()?.emit('chat:message', { content: emoji });
              }}
              onRaiseHand={() => {
                getSocket()?.emit('chat:message', { content: '✋ Raised hand' });
              }}
              onClose={() => setShowReactions(false)}
            />
          )}
        </main>

        {activePanel === 'chat' && (
          <ChatPanel
            messages={messages}
            onSend={handleSendChat}
            onClose={() => setActivePanel(null)}
            meetingTitle={meetingTitle}
          />
        )}

        {activePanel === 'participants' && (
          <ParticipantsPanel
            participants={participants.length ? participants : [{
              socketId: mySocketId,
              displayName,
              isHost,
              audioMuted,
              videoOff,
            }]}
            isHost={isHost}
            mySocketId={mySocketId}
            onClose={() => setActivePanel(null)}
            onMute={handleMuteParticipant}
            onRemove={handleRemoveParticipant}
            onMuteAll={handleMuteAll}
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
        participantCount={participants.length || 1}
        activePanel={activePanel}
        isHost={isHost}
        isRecording={isRecording}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onTogglePanel={(panel) => setActivePanel(activePanel === panel ? null : panel)}
        onEnd={() => setShowEndDialog(true)}
        onEndMeeting={handleEndMeeting}
        onToggleRecording={handleToggleRecording}
        onToggleReactions={() => setShowReactions(!showReactions)}
        showReactions={showReactions}
      />

      {showEndDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Leave meeting?</h3>
            <div className="flex flex-col gap-2">
              <button onClick={handleLeave} className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                Leave meeting
              </button>
              {isHost && (
                <button onClick={handleEndMeeting} className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  End meeting for all
                </button>
              )}
              <button onClick={() => setShowEndDialog(false)} className="w-full py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
