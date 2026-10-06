import { getEventData } from "@/lib/admin-data";

export default async function AdminOverviewLive(){
  const { registrations, sessions } = await getEventData();
  const first=sessions[0]?.id; const second=sessions[1]?.id;
  const registered=(id:string|undefined)=>registrations.filter(person=>person.sessions.some(session=>session.id===id)).length;
  const attended=(id:string|undefined)=>registrations.filter(person=>person.attendance.some(item=>item.sessionId===id&&item.status==="present")).length;
  const both=registrations.filter(person=>person.sessions.length>1).length;
  const certificates=registrations.reduce((total,person)=>total+person.certificates.filter(item=>item.status!=="revoked").length,0);
  const stats=[["Total registrations",registrations.length],["Session 01",registered(first)],["Session 02",registered(second)],["Both sessions",both],["Total attendance",attended(first)+attended(second)],["Certificates",certificates]];
  const days=Array.from({length:10},(_,index)=>{const date=new Date();date.setDate(date.getDate()-(9-index));const key=date.toISOString().slice(0,10);return{key,count:registrations.filter(person=>person.createdAt.slice(0,10)===key).length}}); const max=Math.max(1,...days.map(day=>day.count));
  return <main className="admin-content"><div className="admin-title"><div><span>DASHBOARD / LIVE OVERVIEW</span><h1>Event operations</h1></div><p>{registrations.length ? `${registrations.length} live records` : "No registrations yet"}</p></div><section className="stat-grid">{stats.map(([label,value],index)=><article key={label}><span>0{index+1}</span><strong>{value}</strong><p>{label}</p></article>)}</section><section className="dashboard-grid"><article className="chart-panel"><div className="panel-heading"><h2>Registrations, last 10 days</h2><span>LIVE DATA</span></div><div className="bar-chart" aria-label="Registration count over the last ten days">{days.map(day=><i key={day.key} title={`${day.key}: ${day.count}`} style={{height:`${Math.max(3,(day.count/max)*100)}%`}} />)}</div></article><article className="activity-panel"><div className="panel-heading"><h2>Session readiness</h2></div><ul>{sessions.map((session,index)=><li key={session.id}><span>Session 0{index+1}</span><b>{registered(session.id)} registered</b></li>)}<li><span>Certificates pending</span><b className="warning">{attended(first)+attended(second)-certificates}</b></li></ul></article></section></main>;
}

