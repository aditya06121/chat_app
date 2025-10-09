import React, { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:2000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  const saveAuth = (t, u) => {
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken('')
    setUser(null)
  }

  return { token, user, saveAuth, clearAuth }
}

function Login({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await axios.post(API_BASE + url, { name, email, password })
      onAuthed(res.data.token, res.data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="min-h-full grid place-items-center bg-gray-100 p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-white shadow p-6 space-y-4 rounded">
        <h1 className="text-xl font-semibold">{mode === 'login' ? 'Login' : 'Register'}</h1>
        {mode === 'register' && (
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button className="btn w-full" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
        <button type="button" className="text-sm text-blue-600" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'No account? Register' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  )
}

function App() {
  const { token, user, saveAuth, clearAuth } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const axiosAuth = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE })
    if (token) instance.defaults.headers.common.Authorization = `Bearer ${token}`
    return instance
  }, [token])

  const socket = useMemo(() => {
    if (!token) return null
    return io(API_BASE, { auth: { token } })
  }, [token])

  useEffect(() => {
    if (!socket) return
    const handler = (payload) => {
      if (payload.message.sender === user.id || payload.message.recipient === user.id) {
        setMessages((prev) => [...prev, payload.message])
      }
    }
    socket.on('direct:message', handler)
    return () => { socket.off('direct:message', handler); socket.close() }
  }, [socket, user])

  useEffect(() => {
    if (!token) return
    axiosAuth.get('/api/users').then((res) => setUsers(res.data))
  }, [token, axiosAuth])

  useEffect(() => {
    if (!selectedUserId || !token) return
    ;(async () => {
      // ensure conversation, then load messages
      await axiosAuth.post(`/api/conversations/with/${selectedUserId}`)
      const convs = await axiosAuth.get('/api/conversations')
      const conv = convs.data.find((c) => c.participants.includes(selectedUserId))
      if (!conv) { setMessages([]); return }
      const res = await axiosAuth.get(`/api/conversations/${conv.id}/messages`)
      setMessages(res.data)
    })()
  }, [selectedUserId, token])

  const send = async () => {
    if (!input.trim() || !selectedUserId) return
    if (socket) socket.emit('direct:message', { recipientId: selectedUserId, body: input })
    else await axiosAuth.post(`/api/messages/direct/${selectedUserId}`, { body: input })
    setInput('')
  }

  if (!token || !user) return <Login onAuthed={saveAuth} />

  return (
    <div className="h-full grid grid-cols-[280px_1fr]">
      <aside className="border-r border-gray-200 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{user.name}</div>
          <button className="text-sm text-red-600" onClick={clearAuth}>Logout</button>
        </div>
        <div className="text-xs uppercase text-gray-500 mb-2">Direct messages</div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {users.map((u) => (
            <button
              key={u.id}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${selectedUserId===u.id?'bg-gray-100':''}`}
              onClick={() => setSelectedUserId(u.id)}
            >
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-gray-500">{u.email}</div>
            </button>
          ))}
        </div>
      </aside>
      <main className="flex flex-col">
        <div className="border-b border-gray-200 px-4 py-3 font-semibold">
          {selectedUserId ? users.find((u)=>u.id===selectedUserId)?.name : 'Select a user'}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[70%] px-3 py-2 rounded ${m.sender===user.id?'bg-blue-600 text-white ml-auto':'bg-gray-100'}`}>
              {m.body}
              <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        {selectedUserId && (
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <input className="input flex-1" placeholder="Type a message" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send() }} />
            <button className="btn" onClick={send}>Send</button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App


