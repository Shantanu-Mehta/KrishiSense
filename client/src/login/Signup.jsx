import React from "react";
import './Signupc.css';
import axios from 'axios';
import { useState } from 'react';

function Signup() {
const [msg, setMsg] = useState('');
const[email, setEmail] = useState('');
 const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    const handlesSubmit = async (e) => {
         e.preventDefault();
         try{
            const res=await axios.post('http://localhost:5000/api/auth/signup', {
            
            email,username,password
            });   
             setMsg(res.data.message);
         }
         catch (err) {
      setMsg(err.response.data.message);
    }
    }
    return (
    
      <div className='All'
       style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f1f1 0%, #e3e8fa 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
         <div   style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f1f1 0%, #e3e8fa 100%)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, sans-serif'}}>

            <div style={{ background: '#fff',  padding: '32px', borderRadius: '18px',  minWidth: '420px'}}>
                      <h1 style={{color: '#313d5a', fontWeight: 700, letterSpacing: '1px'}}>Signup Page</h1>
                
            <form onSubmit={handlesSubmit}  style={{ display: 'flex', flexDirection: 'column', gap: '19px' }} >
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                         <label style={{ fontWeight: 500, color: '#25316d' }}> email </label>
                         <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email" 
                         style={{ padding: '12px', color:'black',
                          border: '1px solid #ccdaff', borderRadius: '6px',  background: '#f8faff',   fontSize: '18px', minHeight: '25px', }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                         <label style={{ fontWeight: 500, color: '#25316d' }}> Username </label>
                         <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" 
                         style={{ padding: '12px', color:'black',
                          border: '1px solid #ccdaff', borderRadius: '6px',  background: '#f8faff',   fontSize: '18px', minHeight: '25px', }} />
                      </div>


                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <label style={{ fontWeight: 500, color: '#25316d' }}> Password</label>
                          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" 
                           style={{ padding: '12px', color:'black', border: '1px solid #ccdaff',
                            borderRadius: '6px',  background: '#f8faff',   fontSize: '18px', minHeight: '25px', }}/>
                        </div>
                             <button
                           type="submit"
                           style={{ marginTop: '16px', padding: '13px 0', background: 'linear-gradient(90deg, #4CAF50 0%, #44acff 100%)',
                              color: '#fff',borderRadius: '7px'  }}  > Sign in </button>
                       </form>
                  <p>{msg}</p>
               </div>
             </div>
      </div>
    );

}
export default Signup;