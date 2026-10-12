export default function CertificateArtwork({
  name,
  session,
  id,
}: {
  name: string;
  session: string;
  id: string;
}) {
  const isSession2 =
    session.includes("02") ||
    session.includes("Session 2") ||
    session.toLowerCase().includes("workplace");

  const speaker1 = isSession2
    ? { name: "ROSETE, FRANCIS EMIL", role: "Resource Speaker", sig: "/images/signatures/ROSETE_SIGNATURE.png", sigClass: "sig-rosete" }
    : { name: "UDANI, VARNARD PAULO", role: "Resource Speaker", sig: "/images/signatures/UDANI_SIGNATURE.png", sigClass: "sig-udani" };

  const speaker2 = isSession2
    ? { name: "GONZALES, ICON ZEUS", role: "Resource Speaker", sig: "/images/signatures/GONZALES_SIGNATURE.png", sigClass: "sig-gonzales" }
    : { name: "BALLON, GLENBERG JAMES", role: "Resource Speaker", sig: "/images/signatures/BALLON_SIGNATURE.png", sigClass: "sig-ballon" };

  const organizer = {
    name: "UDANI, VARNARD PAULO",
    role: "Event Head Organizer",
    sig: "/images/signatures/UDANI_SIGNATURE.png",
    sigClass: "sig-udani",
  };

  return (
    <article className="certificate-art certificate-art-v2" id="certificate-preview" aria-label={`Certificate of participation for ${name}`}>
      <header className="certificate-v2-header">
        <div className="certificate-v2-brand">
          <img src="/images/bytecast-icon-v2.png" alt="ByteCast" />
          <div>
            <span>GCCCS - ByteCast</span>
          </div>
        </div>
        <div className="certificate-v2-meta">
          <span>EVENT / DDT-2026</span>
          <b>OCTOBER 18, 2026</b>
        </div>
      </header>
      <div className="certificate-v2-body">
        <span className="certificate-v2-kicker">Certificate of Participation</span>
        <p className="certificate-v2-intro">is presented to</p>
        <h2 className="certificate-v2-name">{name}</h2>
        <p className="certificate-v2-subintro">for participating in the webinar</p>
        <h3 className="certificate-v2-session">{session}</h3>
        <p className="certificate-v2-conducted">conducted by GCCCS - ByteCast.</p>
        <p className="certificate-v2-desc">
          This certificate confirms attendance and participation in the above learning session and reflects engagement in professional development activities related to the stated topic.
        </p>
      </div>
      <div className="certificate-v2-seal-center" aria-label="Verified ByteCast digital certificate">
        <div className="certificate-v2-seal">
          <i className="certificate-v2-seal-orbit" aria-hidden="true" />
          <span>VERIFIED</span>
          <b>ByteCast</b>
          <small>DIGITAL CERTIFICATE</small>
        </div>
      </div>
      <footer className="certificate-v2-footer certificate-v2-footer-3col">
        <div className="certificate-v2-signature">
          <div className="certificate-v2-sig-wrap">
            <img src={speaker1.sig} alt="" className={`certificate-v2-sig-img ${speaker1.sigClass}`} />
          </div>
          <i aria-hidden="true" />
          <b>{speaker1.name}</b>
          <span>{speaker1.role}</span>
        </div>
        <div className="certificate-v2-signature">
          <div className="certificate-v2-sig-wrap">
            <img src={organizer.sig} alt="" className={`certificate-v2-sig-img ${organizer.sigClass}`} />
          </div>
          <i aria-hidden="true" />
          <b>{organizer.name}</b>
          <span>{organizer.role}</span>
        </div>
        <div className="certificate-v2-signature">
          <div className="certificate-v2-sig-wrap">
            <img src={speaker2.sig} alt="" className={`certificate-v2-sig-img ${speaker2.sigClass}`} />
          </div>
          <i aria-hidden="true" />
          <b>{speaker2.name}</b>
          <span>{speaker2.role}</span>
        </div>
      </footer>
      <div className="certificate-v2-bottom-bar">
        <div className="certificate-v2-cred-line">
          <span>Credential ID: <code>{id}</code></span>
          <span>|</span>
          <span>Issued: October 18, 2026</span>
        </div>
        <p className="certificate-v2-disclaimer">
          Attendance or recognition only. Not a professional certification, license, or academic credential. Misuse is prohibited.
        </p>
      </div>
    </article>
  );
}
