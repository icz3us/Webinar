"use client";
import { useState } from "react";
type Person={id:string;name:string;email:string;attendance:string};
export default function AttendanceControls({people}:{people:Person[]}){const[state,setState]=useState(Object.fromEntries(people.map(p=>[p.id,p.attendance])));return <div className="attendance-list">{people.map(p=><article key={p.id}><div><strong>{p.name}</strong><span>{p.email}</span></div><div className="attendance-actions"><button className={state[p.id]==="Present"?"active":""} onClick={()=>setState({...state,[p.id]:"Present"})}>Present</button><button className={state[p.id]==="Absent"?"active absent":""} onClick={()=>setState({...state,[p.id]:"Absent"})}>Absent</button><button onClick={()=>setState({...state,[p.id]:"Not marked"})}>Undo</button></div></article>)}</div>}

