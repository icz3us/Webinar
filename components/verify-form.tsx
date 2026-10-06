"use client";
import { useState } from "react";
export default function VerifyForm(){const[id,setId]=useState("");return <form className="verify-form" onSubmit={(e)=>{e.preventDefault();if(id.trim())location.assign(`/verify/${encodeURIComponent(id.trim())}`)}}><label><span>Certificate ID</span><input value={id} onChange={(e)=>setId(e.target.value)} required placeholder="DDT-..." /></label><button className="button button-primary">Check certificate</button></form>}

