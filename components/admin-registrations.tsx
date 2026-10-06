import { getEventData } from "@/lib/admin-data";
import RegistrationsTable from "@/components/registrations-table";
import RegistrantMessageForm from "@/components/registrant-message-form";
export default async function AdminRegistrationsLive(){const{registrations}=await getEventData();return <main className="admin-content"><div className="admin-title"><div><span>MANAGEMENT / LIVE REGISTRATIONS</span><h1>Participants</h1></div><p>{registrations.length} records</p></div><RegistrantMessageForm/><RegistrationsTable people={registrations}/></main>}
