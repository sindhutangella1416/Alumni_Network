import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CheckCheck, Image as ImageIcon, Mic, Plus, Send, Smile, Square, FileText, MessageCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const API = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000';

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fileHref = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('uploads/')) return `${API}/${path}`;
  if (/^https?:\/\//i.test(path)) return path;
  return null;
};

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [session, setSession] = useState(null);
  const [connections, setConnections] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const fileInputRef = useRef(null);

  // Initialize Auth
  useEffect(() => {
    const raw = localStorage.getItem('alumni_user');
    if (!raw) { navigate('/login'); return; }
    const user = JSON.parse(raw);
    setSession(user);
    loadConnections(user.email);
  }, [navigate]);

  const loadConnections = async (email) => {
    try {
      const res = await fetch(`${API}/connections?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.connections) setConnections(data.connections);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (userEmail, peerEmail) => {
    if (!userEmail || !peerEmail) return;
    try {
      const res = await fetch(`${API}/messages?email=${encodeURIComponent(userEmail)}&with_email=${encodeURIComponent(peerEmail)}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  // WebSocket Connection
  useEffect(() => {
    if (!session) return;
    const socket = new WebSocket(`${WS_URL}/ws/${session.email}`);
    ws.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'user_status') {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.status === 'online') next.add(data.email);
          else next.delete(data.email);
          return next;
        });
      } else if (data.type === 'new_message') {
        const msg = data.message;
        // Normalize _id to id if necessary
        msg.id = msg.id || msg._id; 
        
        // Add to view if it's relevant to current chat
        setChatWith((currentChatWith) => {
          if (currentChatWith && (msg.from_email === currentChatWith.email || msg.to_email === currentChatWith.email)) {
            setMessages((prev) => {
              if (prev.find(m => m.id === msg.id)) return prev;
              const newArr = [...prev, msg];
              // Trigger auto-scroll on next tick
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
              return newArr;
            });

            // Send read receipt if we received it
            if (msg.to_email === session.email && msg.from_email === currentChatWith.email) {
              socket.send(JSON.stringify({ 
                action: 'read_receipt', 
                message_ids: [msg.id], 
                sender_email: msg.from_email 
              }));
            }
          }
          return currentChatWith;
        });
      } else if (data.type === 'status_update') {
        setMessages((prev) => prev.map(m => 
          data.message_ids.includes(m.id) ? { ...m, status: data.status } : m
        ));
      }
    };

    return () => socket.close();
  }, [session]);

  // Set Chat Partner via URL
  useEffect(() => {
    const withEmail = searchParams.get('with');
    if (withEmail && connections.length > 0) {
      const found = connections.find(c => c.email === withEmail);
      if (found && found.email !== chatWith?.email) {
        setChatWith(found);
        loadMessages(session.email, found.email);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 100);
      }
    }
  }, [searchParams, connections, session, chatWith?.email]);

  // Handle media uploading
  const uploadAndSend = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload-chat-media`, { method: 'POST', body: fd });
      const data = await res.json();
      
      let msgType = 'file';
      if (file.type.startsWith('image/')) msgType = 'image';
      else if (file.type.startsWith('audio/')) msgType = 'audio';

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          action: 'send_message',
          to_email: chatWith.email,
          body: file.name || 'Voice Message',
          msg_type: msgType,
          file_url: data.url
        }));
      }
    } catch (e) {
      console.error("Upload failed", e);
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!draft.trim() || !chatWith || !ws.current) return;
    
    ws.current.send(JSON.stringify({
      action: 'send_message',
      to_email: chatWith.email,
      body: draft.trim(),
      msg_type: 'text',
      file_url: ''
    }));
    setDraft('');
    setShowEmoji(false);
  };

  const handleEmojiClick = (emojiObj) => {
    setDraft((prev) => prev + emojiObj.emoji);
  };

  // Audio Recording feature
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          audioChunks.current = [];
          const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
          uploadAndSend(file);
          stream.getTracks().forEach(track => track.stop());
        };
        audioChunks.current = [];
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied", err);
      }
    }
  };

  // File & DragDrop Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAndSend(file);
    setShowAttach(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (!chatWith) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAndSend(file);
  };

  const isSent = (msg) => msg.from_email === session?.email;

  if (!session) return null;

  return (
    <div className="chat-container" style={{ display: 'flex', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
      
      {/* Sidebar List */}
      <div className="sidebar" style={{ width: '30%', minWidth: '280px', borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          My Contacts
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {connections.length === 0 && (
            <p className="text-muted" style={{ padding: '2rem 1rem', textAlign: 'center' }}>No connections yet!</p>
          )}
          {connections.map(c => {
            const active = chatWith?.email === c.email;
            const online = onlineUsers.has(c.email);
            return (
              <div 
                key={c.email} 
                onClick={() => setSearchParams({ with: c.email })}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '1rem', cursor: 'pointer', 
                  borderBottom: '1px solid var(--border)', background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                  {c.profilePhoto ? (
                    <img src={fileHref(c.profilePhoto)} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    c.name.charAt(0).toUpperCase()
                  )}
                  {online && <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, background: '#25D366', borderRadius: '50%', border: '2px solid var(--surface)' }} />}
                </div>
                <div style={{ marginLeft: '1rem', flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{c.email}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {chatWith ? (
        <div 
          className="chat-main" 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#efeae2', position: 'relative' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
              {chatWith.profilePhoto ? (
                <img src={fileHref(chatWith.profilePhoto)} alt={chatWith.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                chatWith.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{chatWith.name}</div>
              <div style={{ fontSize: '0.85rem', color: onlineUsers.has(chatWith.email) ? '#25D366' : 'var(--text-muted)' }}>
                {onlineUsers.has(chatWith.email) ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Messages view */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', background: '#ffeecd', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                Messages are end-to-end encrypted. No one outside of this chat can read or listen to them.
              </div>
            )}

            {messages.map((m, idx) => {
              const sent = isSent(m);
              // WhatsApp style colors: Sent = #d9fdd3, Received = #ffffff
              const bubbleBg = sent ? '#d9fdd3' : '#ffffff'; 

              return (
                <div key={m.id || idx} style={{ display: 'flex', justifyContent: sent ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    background: bubbleBg, 
                    maxWidth: '65%', 
                    padding: '0.5rem', 
                    borderRadius: '8px',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    {m.type === 'image' && (
                      <img src={m.file_url.startsWith('http') ? m.file_url : `${API}/${m.file_url}`} alt="Shared media" style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '4px', display: 'block' }} />
                    )}
                    {m.type === 'audio' && (
                      <audio controls src={m.file_url.startsWith('http') ? m.file_url : `${API}/${m.file_url}`} style={{ height: '40px', outline: 'none' }} />
                    )}
                    {m.type === 'file' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginBottom: '4px' }}>
                        <FileText size={24} />
                        <a href={m.file_url.startsWith('http') ? m.file_url : `${API}/${m.file_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', wordBreak: 'break-all' }}>{m.body}</a>
                      </div>
                    )}
                    
                    {m.type === 'text' && <div style={{ fontSize: '0.95rem', wordBreak: 'break-word', paddingRight: sent ? '40px' : '0' }}>{m.body}</div>}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      alignItems: 'center', 
                      gap: '4px', 
                      marginTop: m.type === 'text' ? '-10px' : '4px', 
                      float: m.type === 'text' ? 'right' : 'none' 
                    }}>
                      <span style={{ fontSize: '0.65rem', color: '#667781' }}>{formatTime(m.created_at)}</span>
                      {sent && (
                        m.status === 'seen' ? <CheckCheck size={14} color="#53bdeb" /> :
                        m.status === 'delivered' ? <CheckCheck size={14} color="#667781" /> :
                        <Check size={14} color="#667781" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Drag and Drop Overlay */}
          {dragActive && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', fontWeight: 'bold' }}>Drop files here to send</div>
            </div>
          )}

          {/* Emoji Picker Overlay */}
          {showEmoji && (
            <div style={{ position: 'absolute', bottom: '70px', left: '10px', zIndex: 100 }}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          {/* Attachment Overlay */}
          {showAttach && (
            <div style={{ position: 'absolute', bottom: '70px', left: '60px', background: 'var(--surface)', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', gap: '1rem', zIndex: 100 }}>
              <button className="flex-center" style={{ flexDirection: 'column', background: 'none', border: 'none', cursor: 'pointer', gap: '0.5rem' }} onClick={() => fileInputRef.current?.click()}>
                <div style={{ background: '#bf59cf', color: '#fff', padding: '0.75rem', borderRadius: '50%' }}><ImageIcon size={24} /></div>
                <span style={{ fontSize: '0.8rem' }}>Photos & Videos</span>
              </button>
              <button className="flex-center" style={{ flexDirection: 'column', background: 'none', border: 'none', cursor: 'pointer', gap: '0.5rem' }} onClick={() => fileInputRef.current?.click()}>
                <div style={{ background: '#5157ae', color: '#fff', padding: '0.75rem', borderRadius: '50%' }}><FileText size={24} /></div>
                <span style={{ fontSize: '0.8rem' }}>Document</span>
              </button>
            </div>
          )}

          {/* Input Area */}
          <form 
            onSubmit={handleSendText} 
            style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f0f2f5', zIndex: 10 }}
          >
            <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
            
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
              <Smile size={26} color="#54656f" />
            </button>
            <button type="button" onClick={() => setShowAttach(!showAttach)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
              <Plus size={28} color="#54656f" />
            </button>

            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '0.6rem 1rem', margin: '0 0.5rem', display: 'flex' }}>
              {isRecording ? (
                <div style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                  Recording audio...
                </div>
              ) : (
                <input
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' }}
                  placeholder="Type a message"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              )}
            </div>

            {draft.trim() ? (
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <Send size={24} color="#54656f" />
              </button>
            ) : (
              <button type="button" onClick={toggleRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                {isRecording ? <Square size={24} fill="#ef4444" color="#ef4444" /> : <Mic size={24} color="#54656f" />}
              </button>
            )}
          </form>

        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#efeae2', flexDirection: 'column' }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'full', color: 'var(--text-muted)' }}>
            <MessageCircle size={64} style={{ opacity: 0.5 }} />
          </div>
          <h2 style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Alumni Web Chat</h2>
          <p style={{ color: 'var(--text-muted)' }}>Select a contact to start messaging.</p>
        </div>
      )}
    </div>
  );
}
