import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'
import { getCurrentUser } from '../services/auth'

const SAMPLE_TOKENS = [
  {
    label: 'Alice — Employee',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJuYW1lIjoiQWxpY2UgRW1wbG95ZWUiLCJyb2xlIjoiZW1wbG95ZWUiLCJtYW5hZ2VyX2lkIjoiYmJiYmJiYmItMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAyIiwiZGVwYXJ0bWVudCI6IkVuZ2luZWVyaW5nIiwiZXhwIjoxNzg4OTQzNjg3fQ.UDP6GA0ptQYwXdzHp-_CUrQA4awX-pPej8DYAAkAJ_8',
  },
  {
    label: 'Bob — Manager',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmJiYmJiYi0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIiLCJuYW1lIjoiQm9iIE1hbmFnZXIiLCJyb2xlIjoibWFuYWdlciIsIm1hbmFnZXJfaWQiOm51bGwsImRlcGFydG1lbnQiOiJFbmdpbmVlcmluZyIsImV4cCI6MTc4ODk0MzY4N30.jp6-pg7BHcyWBm0NS1zbrrhafX-VMfQ-pSjgjSjRoAA',
  },
  {
    label: 'Carol — Auditor',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjY2NjY2NjYy0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDMiLCJuYW1lIjoiQ2Fyb2wgQXVkaXRvciIsInJvbGUiOiJhdWRpdG9yIiwibWFuYWdlcl9pZCI6bnVsbCwiZGVwYXJ0bWVudCI6IkZpbmFuY2UiLCJleHAiOjE3ODg5NDM2ODd9.375GlrbPTpTMuCQIA52CCg5TXG544rLAFHNwaWybjK8',
  },
  {
    label: 'Dave — Admin',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZGRkZGRkZC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDQiLCJuYW1lIjoiRGF2ZSBBZG1pbiIsInJvbGUiOiJhZG1pbiIsIm1hbmFnZXJfaWQiOm51bGwsImRlcGFydG1lbnQiOiJJVCIsImV4cCI6MTc4ODk0MzY4N30.mKekocL10k3idq7GblobYvIIrbR1CQBr4HkglalceXA',
  },
]

const ROLE_DEST: Record<string, string> = {
  employee: '/employee/submit',
  manager: '/manager/queue',
  auditor: '/auditor/dashboard',
  admin: '/admin/policy',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  function login(t: string) {
    const tok = t.trim()
    if (!tok) { setError('Paste a JWT token to continue.'); return }
    localStorage.setItem('auth_token', tok)
    const user = getCurrentUser()
    if (!user) {
      setError('Invalid token — could not decode claims.')
      localStorage.removeItem('auth_token')
      return
    }
    navigate(ROLE_DEST[user.role] ?? '/', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1>Expense Reimbursement</h1>
        <p className="login-subtitle">Paste a JWT bearer token or pick a demo user below.</p>

        <div className="form-group">
          <label className="form-label" htmlFor="jwt-input">JWT Token</label>
          <textarea
            id="jwt-input"
            className="form-textarea login-textarea"
            placeholder="Paste JWT token here…"
            value={token}
            onChange={e => { setToken(e.target.value); setError('') }}
            rows={4}
          />
          {error && <span className="login-error">{error}</span>}
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={() => login(token)}>
          Sign in
        </button>

        <div className="login-divider">or use a demo account</div>

        <p className="login-demo-label">Demo users</p>
        <div className="login-demo-list">
          {SAMPLE_TOKENS.map(({ label, token: t }) => (
            <button
              key={label}
              className="btn-secondary login-demo-btn"
              onClick={() => login(t)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
