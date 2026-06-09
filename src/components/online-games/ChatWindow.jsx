import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Send } from 'lucide-react'

/**
 * Safe polling chat.
 * Realtime chat was crashing rooms because postgres_changes callbacks were being
 * attached after subscribe() in some builds. Polling keeps the room screen stable.
 */
export default function ChatWindow({ roomCode, session }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [status, setStatus] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchMessages() {
      if (!roomCode || !session?.user?.id) {
        if (!cancelled) setMessages([])
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, message, created_at, user_id')
        .eq('room_code', String(roomCode).toUpperCase())
        .order('created_at', { ascending: true })
        .limit(50)

      if (cancelled) return

      if (error) {
        console.warn('[ChatWindow] fetch failed:', error.message)
        setStatus('Chat unavailable. Game still works.')
        setMessages([])
        return
      }

      setStatus('')
      setMessages(data || [])
    }

    fetchMessages()
    const timer = window.setInterval(fetchMessages, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [roomCode, session?.user?.id])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function sendMessage(e) {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !roomCode || !session?.user?.id) return

    setNewMessage('')

    const { error } = await supabase.from('chat_messages').insert({
      room_code: String(roomCode).toUpperCase(),
      user_id: session.user.id,
      message: text,
    })

    if (error) {
      console.warn('[ChatWindow] send failed:', error.message)
      setStatus('Message failed. Game still works.')
      return
    }

    // Update immediately without waiting for next poll.
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, room_code: roomCode, user_id: session.user.id, message: text, created_at: new Date().toISOString() },
    ])
  }

  return (
    <div className="chat-window safe-chat">
      <div className="chat-header">
        <strong>Room Chat</strong>
        <span>{roomCode || 'LOCAL'}</span>
      </div>

      <div ref={listRef} className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet.</p>
        ) : messages.map((msg) => {
          const isMe = msg.user_id === session?.user?.id
          return (
            <div key={msg.id} className={`chat-message ${isMe ? 'mine' : ''}`}>
              <div className="chat-message-text">{msg.message}</div>
              <small>{isMe ? 'You' : 'Player'} · {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
            </div>
          )
        })}
      </div>

      {status && <p className="chat-status">{status}</p>}

      <form onSubmit={sendMessage} className="chat-form">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message room…"
        />
        <button type="submit" disabled={!newMessage.trim()} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
