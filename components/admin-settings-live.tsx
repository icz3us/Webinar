import { getEventAndSessions } from "@/lib/admin-data";
import { isRegistrationOpen } from "@/lib/registration-status";
import AdminRegistrationToggle from "@/components/admin-registration-toggle";

export default async function AdminSettingsLive() {
  const [{ event, sessions }, registrationOpen] = await Promise.all([
    getEventAndSessions(),
    isRegistrationOpen(),
  ]);

  const rows = [
    ["Event title", event.title],
    ["Event date", event.event_date],
    ["Description", event.description],
    ...sessions.flatMap((session, index) => [
      [`Session 0${index + 1}`, session.title],
      [
        `Session 0${index + 1} time`,
        `${new Date(session.start_time).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        })} - ${new Date(session.end_time).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        })}`,
      ],
    ]),
  ];

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>SYSTEM / LIVE CONFIGURATION</span>
          <h1>Event settings</h1>
        </div>
      </div>

      <AdminRegistrationToggle initialIsOpen={registrationOpen} />

      <div className="settings-record">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <p className="config-note">
        Event configuration is stored in Supabase. Google Meet and email secrets remain protected in environment variables.
      </p>
    </main>
  );
}
