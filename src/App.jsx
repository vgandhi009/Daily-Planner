/* Minimal working app to verify deploy; replace with your full planner later */
import React from 'react'
export default function App(){
  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center'}}>
      <div style={{padding:24,border:'1px solid #eee',borderRadius:16,boxShadow:'0 8px 24px rgba(0,0,0,.06)'}}>
        <h1 style={{margin:0,fontSize:28}}>Vrunda’s Daily Planner</h1>
        <p style={{marginTop:8,opacity:.7}}>Deployment sanity check ✅</p>
      </div>
    </div>
  )
}
