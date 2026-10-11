export default function CertificateArtwork({
  name,
  session,
  id,
}: {
  name: string;
  session: string;
  id: string;
}) {
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
        <p>This certificate is presented to</p>
        <h2>{name}</h2>
        <i className="certificate-v2-name-rule" aria-hidden="true" />
        <p>for verified attendance and participation in</p>
        <h3>{session}</h3>
        <p className="certificate-v2-event">
          Deepfakes &amp; Digital Trust
          <small>Recognizing AI-Generated Media and Misinformation</small>
        </p>
      </div>
      <footer className="certificate-v2-footer">
        <div className="certificate-v2-signature">
          <i aria-hidden="true" />
          <b>Event Organizer</b>
          <span>Authorized signature</span>
        </div>
        <div className="certificate-v2-seal" aria-label="Verified ByteCast digital certificate">
          <i className="certificate-v2-seal-orbit" aria-hidden="true" />
          <span>VERIFIED</span>
          <b>ByteCast</b>
          <small>DIGITAL CERTIFICATE</small>
        </div>
        <div className="certificate-v2-signature">
          <i aria-hidden="true" />
          <b>College Representative</b>
          <span>Authorized signature</span>
        </div>
      </footer>
      <div className="certificate-v2-id">
        <span>CERTIFICATE ID</span>
        <code>{id}</code>
        <span>VERIFY / DIGITAL RECORD</span>
      </div>
    </article>
  );
}
