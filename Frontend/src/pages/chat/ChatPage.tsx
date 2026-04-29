/**
 * ChatPage.tsx — Real-time chat + WebRTC video/voice calls
 *
 * Step 4: live messages, typing indicators, online/offline status
 * Step 5 update: video call + voice call via WebRTC (useWebRTC hook + CallModal)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, MessageCircle, Loader, Wifi, WifiOff } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { CallModal } from '../../components/call/CallModal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Message, ChatConversation, User } from '../../types';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';

export const ChatPage: React.FC = () => {
  const { userId }              = useParams<{ userId: string }>();
  const { user: currentUser }   = useAuth();
  const { socket, isConnected, emit } = useSocket();

  const [messages, setMessages]           = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [chatPartner, setChatPartner]     = useState<User | null>(null);
  const [newMessage, setNewMessage]       = useState('');
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [sending, setSending]             = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const messagesEndRef   = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef      = useRef(false);

  // ── WebRTC ──────────────────────────────────────────────────────────────
  const webrtc = useWebRTC(userId);

  // ── Conversations sidebar ───────────────────────────────────────────────
  const refreshConversations = useCallback(() => {
    messageService.getConversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refreshConversations();
  }, [currentUser, refreshConversations]);

  // ── Load thread + partner ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !userId) return;
    setLoadingMsgs(true);
    setPartnerTyping(false);
    Promise.all([
      messageService.getConversation(userId),
      userService.getUserById(userId),
    ])
      .then(([msgs, partner]) => {
        setMessages(msgs);
        setChatPartner(partner);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [currentUser, userId]);

  // ── Socket: join room ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !userId) return;
    emit('join_room', userId);
  }, [socket, userId, emit]);

  // ── Socket: new messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (msg: any) => {
      const normalised: Message = {
        id:         msg._id || msg.id,
        senderId:   msg.senderId?.toString?.() ?? msg.senderId,
        receiverId: msg.receiverId?.toString?.() ?? msg.receiverId,
        content:    msg.content,
        timestamp:  msg.createdAt || msg.timestamp,
        isRead:     msg.isRead,
      };

      const isCurrentChat =
        (normalised.senderId === userId && normalised.receiverId === currentUser.id) ||
        (normalised.senderId === currentUser.id && normalised.receiverId === userId);

      if (isCurrentChat) {
        setMessages(prev => {
          if (prev.some(m => m.id === normalised.id)) return prev;
          return [...prev, normalised];
        });
        setPartnerTyping(false);
      }
      refreshConversations();
    };

    socket.on('new_message', handleNewMessage);
    return () => { socket.off('new_message', handleNewMessage); };
  }, [socket, currentUser, userId, refreshConversations]);

  // ── Socket: typing ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onStart = ({ senderId }: { senderId: string }) => {
      if (senderId === userId) setPartnerTyping(true);
    };
    const onStop = ({ senderId }: { senderId: string }) => {
      if (senderId === userId) setPartnerTyping(false);
    };

    socket.on('typing_start', onStart);
    socket.on('typing_stop',  onStop);
    return () => {
      socket.off('typing_start', onStart);
      socket.off('typing_stop',  onStop);
    };
  }, [socket, userId]);

  // ── Socket: online/offline ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onOnline  = ({ userId: uid }: { userId: string }) => {
      if (uid === chatPartner?.id) setChatPartner(p => p ? { ...p, isOnline: true }  : p);
    };
    const onOffline = ({ userId: uid }: { userId: string }) => {
      if (uid === chatPartner?.id) setChatPartner(p => p ? { ...p, isOnline: false } : p);
    };

    socket.on('user_online',  onOnline);
    socket.on('user_offline', onOffline);
    return () => {
      socket.off('user_online',  onOnline);
      socket.off('user_offline', onOffline);
    };
  }, [socket, chatPartner?.id]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // ── Typing emission ─────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!userId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emit('typing_start', { receiverId: userId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emit('typing_stop', { receiverId: userId });
    }, 2000);
  };

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || sending) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      emit('typing_stop', { receiverId: userId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    try {
      const sent = await messageService.sendMessage(userId, newMessage.trim());
      setMessages(prev => {
        if (prev.some(m => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setNewMessage('');
      refreshConversations();
    } catch {
      // error shown by axios interceptor
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* WebRTC Call Modal — renders over everything when a call is active */}
      <CallModal webrtc={webrtc} partner={chatPartner} />

      <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">

        {/* Sidebar */}
        <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
          <ChatUserList conversations={conversations} />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {chatPartner ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar
                    src={chatPartner.avatarUrl}
                    alt={chatPartner.name}
                    size="md"
                    status={chatPartner.isOnline ? 'online' : 'offline'}
                    className="mr-3"
                  />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">
                        {partnerTyping
                          ? 'typing…'
                          : chatPartner.isOnline
                            ? 'Online'
                            : 'Last seen recently'}
                      </p>
                      {isConnected
                        ? <Wifi size={12} className="text-green-500" title="Real-time connected" />
                        : <WifiOff size={12} className="text-gray-400" title="Connecting…" />
                      }
                    </div>
                  </div>
                </div>

                {/* Call buttons — wired to WebRTC */}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    onClick={() => webrtc.startCall('voice')}
                    title="Voice call"
                    disabled={webrtc.callState !== 'idle'}
                  >
                    <Phone size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    onClick={() => webrtc.startCall('video')}
                    title="Video call"
                    disabled={webrtc.callState !== 'idle'}
                  >
                    <Video size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <Info size={18} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader size={28} className="animate-spin text-primary-500" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        isCurrentUser={msg.senderId === currentUser.id}
                        sender={msg.senderId === currentUser.id ? currentUser : chatPartner}
                      />
                    ))}

                    {/* Typing indicator */}
                    {partnerTyping && (
                      <div className="flex justify-start mb-4 animate-fade-in">
                        <Avatar
                          src={chatPartner.avatarUrl}
                          alt={chatPartner.name}
                          size="sm"
                          className="mr-2 self-end"
                        />
                        <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none px-4 py-3">
                          <div className="flex space-x-1 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <MessageCircle size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                    <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                  <Button type="button" variant="ghost" size="sm" className="rounded-full p-2 flex-shrink-0">
                    <Smile size={20} />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim() || sending}
                    isLoading={sending}
                    className="rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <MessageCircle size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
              <p className="text-gray-500 mt-2 text-center">Choose a contact from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
