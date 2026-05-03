const GREEN = "#1B4332";
const AMBER = "#D97706";
const INK = "#1C1917";
const CREAM = "#FEFBF3";
const EFFECTIVE_DATE = "May 3, 2026";
const SITE_NAME = "BuildGuiders";
const SITE_URL = "buildguiders.com";
const CONTACT_EMAIL = "GuidersNetwork@gmail.com";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans', sans-serif", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .amber-bar { height:5px;background:linear-gradient(90deg,${AMBER},#F59E0B,${AMBER});background-size:200% 100%;animation:shimmer 3s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        .nav-link { color:#fff;font-size:13px;font-weight:600;text-decoration:none;opacity:0.85;transition:opacity 0.15s; }
        .nav-link:hover { opacity:1; }
        .prose h2 { font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:${INK};letter-spacing:-0.5px;margin-top:40px;margin-bottom:12px; }
        .prose h3 { font-size:15px;font-weight:700;color:${INK};margin-top:24px;margin-bottom:8px; }
        .prose p { font-size:15px;color:#44403C;line-height:1.75;margin-bottom:14px; }
        .prose ul { padding-left:20px;margin-bottom:14px; }
        .prose li { font-size:15px;color:#44403C;line-height:1.75;margin-bottom:6px; }
        .prose a { color:${GREEN};text-decoration:none; }
        .prose a:hover { text-decoration:underline; }
        .section-divider { border:none;border-top:1px solid #E7E5E4;margin:8px 0 0; }
      `}</style>

      {/* Nav */}
      <header style={{ background: GREEN }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <nav style={{ display: "flex", gap: 20 }}>
            <a href="/#calculators" className="nav-link">Calculators</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
        </div>
        <div className="amber-bar" />
      </header>

      {/* Hero */}
      <div style={{ borderBottom: `2.5px solid ${INK}`, background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "44px 24px 36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GREEN, borderRadius: 4, padding: "5px 12px", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.09em" }}>Legal</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, lineHeight: 1.05, color: INK, letterSpacing: "-1.5px", marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 15, color: "#78716C" }}>
            Effective date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;·&nbsp; {SITE_URL}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div className="prose">

          <p>
            {SITE_NAME} ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>") operates {SITE_URL} (the "<strong>Site</strong>"). This Privacy Policy explains what information we collect, how we use it, who we share it with, and your rights regarding that information. We've written it in plain language because we think you deserve to actually understand it.
          </p>
          <p>
            By using the Site, you agree to this Privacy Policy. If you do not agree, please do not use the Site.
          </p>

          <hr className="section-divider" />

          <h2>1. The short version</h2>
          <p>
            BuildGuiders is a free calculator tool. <strong>We do not require you to create an account, provide your name, or give us your email address.</strong> We don't sell your data. We don't run ads that track you across the web. Our calculators run entirely in your browser — no inputs you enter are transmitted to our servers.
          </p>
          <p>
            What we do use: standard web analytics (to understand how many people visit and which pages are popular) and affiliate tracking cookies (when you click links to Amazon, Home Depot, or other retailers). Both are explained in detail below.
          </p>

          <hr className="section-divider" />

          <h2>2. Information we collect</h2>

          <h3>Information you provide directly</h3>
          <p>
            We have no forms, accounts, or email signups on the Site. The only way to voluntarily contact us is by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If you email us, we receive your email address and the content of your message. We use this only to respond to you.
          </p>

          <h3>Information collected automatically</h3>
          <p>When you visit the Site, standard web server and analytics technology may automatically collect:</p>
          <ul>
            <li>Your IP address (typically truncated and anonymized)</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited, time on page, and referring URL</li>
            <li>General geographic location (country/region, derived from IP)</li>
            <li>Device type (desktop, mobile, tablet)</li>
          </ul>
          <p>
            This information is used in aggregate to understand how the Site is used and to improve it. We do not use this data to personally identify you.
          </p>

          <h3>Calculator inputs</h3>
          <p>
            All calculator logic runs entirely in your browser using JavaScript. Dimensions and other values you enter into our calculators are <strong>not transmitted to our servers</strong> and are <strong>not stored anywhere</strong>. When you close or refresh the page, your inputs are gone.
          </p>

          <hr className="section-divider" />

          <h2>3. Cookies and tracking technologies</h2>

          <h3>What are cookies?</h3>
          <p>
            Cookies are small text files placed on your device by websites you visit. They serve different purposes — some are essential for a site to function, others help the site owner understand how visitors use the site, and others are used for advertising or affiliate tracking.
          </p>

          <h3>Cookies we use</h3>

          <h3>Analytics cookies</h3>
          <p>
            We use Google Analytics to understand aggregate traffic patterns on the Site. Google Analytics uses cookies to collect anonymized data about how visitors interact with our pages. We have configured Google Analytics with IP anonymization enabled. Google Analytics does not receive your personally identifiable information from us.
          </p>
          <p>
            You can opt out of Google Analytics tracking across all websites by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
          </p>

          <h3>Affiliate tracking cookies</h3>
          <p>
            BuildGuiders participates in affiliate programs. When you click an affiliate link on our Site (for example, a link to a product on Amazon.com or HomeDepot.com), the retailer may place a cookie on your device to track whether you complete a purchase. If you do, we receive a small commission at no additional cost to you.
          </p>
          <p>
            These affiliate programs include, but are not limited to:
          </p>
          <ul>
            <li><strong>Amazon Associates</strong> — operated by Amazon.com, Inc. Amazon may place cookies subject to <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" target="_blank" rel="noopener noreferrer">Amazon's Privacy Notice</a>.</li>
            <li><strong>Home Depot affiliate program</strong> — operated via Commission Junction (CJ Affiliate). Subject to <a href="https://www.homedepot.com/c/privacy_security" target="_blank" rel="noopener noreferrer">Home Depot's Privacy Policy</a> and <a href="https://www.cj.com/legal/privacy" target="_blank" rel="noopener noreferrer">CJ Affiliate's Privacy Policy</a>.</li>
            <li><strong>Lowe's affiliate program</strong> — operated via Commission Junction (CJ Affiliate). Subject to <a href="https://www.lowes.com/l/privacy.html" target="_blank" rel="noopener noreferrer">Lowe's Privacy Policy</a> and CJ Affiliate's Privacy Policy.</li>
            <li><strong>Other retailers</strong> — we may add additional affiliate programs over time. All will be disclosed here when added.</li>
          </ul>
          <p>
            These third-party affiliate tracking cookies are placed by the retailers, not by us. We do not control how third parties collect or use your data. We encourage you to review the privacy policies linked above.
          </p>
          <p>
            <strong>To opt out of affiliate tracking cookies:</strong> You can manage or delete cookies through your browser settings. Most browsers allow you to block third-party cookies or clear cookies entirely. Note that blocking cookies does not affect the functionality of our calculators.
          </p>

          <h3>Commission Junction (CJ Affiliate) disclosure</h3>
          <p>
            Some of our affiliate links are served through Commission Junction, Inc. (CJ Affiliate). CJ may use cookies and other tracking technologies to attribute transactions to our publisher account. CJ's tracking code operates in accordance with <a href="https://www.cj.com/legal/privacy" target="_blank" rel="noopener noreferrer">CJ Affiliate's Privacy Policy</a>. CJ does not collect personally identifiable information from our visitors beyond what is necessary to track referral transactions.
          </p>

          <hr className="section-divider" />

          <h2>4. How we use information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Operate and improve the Site and its calculators</li>
            <li>Understand how visitors use the Site in aggregate</li>
            <li>Earn affiliate commissions when visitors purchase products through our links (which keeps the Site free)</li>
            <li>Respond to emails or inquiries sent to us directly</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not use your information to send you marketing emails, create advertising profiles, or sell your data to third parties.
          </p>

          <hr className="section-divider" />

          <h2>5. How we share information</h2>
          <p>
            We do not sell, rent, or trade your personal information. We may share information in the following limited circumstances:
          </p>
          <ul>
            <li><strong>Affiliate networks and retailers:</strong> When you click affiliate links, the destination retailer and any affiliate network (such as CJ Affiliate) will receive the information necessary to attribute the referral.</li>
            <li><strong>Analytics providers:</strong> Aggregated, anonymized analytics data is shared with Google Analytics.</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law, subpoena, or to protect the rights, property, or safety of BuildGuiders, our users, or the public.</li>
            <li><strong>Business transfers:</strong> If BuildGuiders is acquired or merged, your information may transfer to the new owner as part of that transaction.</li>
          </ul>

          <hr className="section-divider" />

          <h2>6. Affiliate disclosure (FTC compliance)</h2>
          <p>
            BuildGuiders participates in affiliate marketing programs. This means we earn commissions when you click links on our Site and make qualifying purchases on third-party retail sites. <strong>This does not affect the price you pay.</strong> Our affiliate relationships do not influence which products or quantities we recommend — our calculators are based on industry-standard formulas and our own research.
          </p>
          <p>
            In compliance with the FTC's Endorsement Guides, we disclose our affiliate relationships prominently on this page, on our <a href="/about">About page</a>, and in the footer of every page on the Site.
          </p>

          <hr className="section-divider" />

          <h2>7. Third-party links</h2>
          <p>
            Our Site contains links to third-party websites including Amazon, Home Depot, Lowe's, Menards, and other retailers. When you click those links, you leave our Site and are subject to the privacy policies of those third-party sites. We are not responsible for the content or privacy practices of third-party websites.
          </p>

          <hr className="section-divider" />

          <h2>8. Children's privacy</h2>
          <p>
            The Site is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child under 13, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will delete it promptly.
          </p>

          <hr className="section-divider" />

          <h2>9. California privacy rights (CCPA)</h2>
          <p>
            If you are a California resident, you have the right to request:
          </p>
          <ul>
            <li>What personal information we have collected about you</li>
            <li>The categories of sources from which we collected it</li>
            <li>The purposes for which we use it</li>
            <li>The categories of third parties we share it with</li>
            <li>Deletion of your personal information (subject to certain exceptions)</li>
          </ul>
          <p>
            Given the minimal data we collect (primarily anonymized analytics and affiliate cookie data), most of these requests will confirm that we hold little to no personally identifiable information about you. To submit a request, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within 45 days as required by law.
          </p>
          <p>
            We do not sell personal information as defined by the CCPA. We do not discriminate against users who exercise their privacy rights.
          </p>

          <hr className="section-divider" />

          <h2>10. Data security</h2>
          <p>
            We use industry-standard practices to protect the information we hold. The Site is served over HTTPS. Our calculator inputs are never transmitted to or stored on our servers, eliminating that attack surface entirely. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <hr className="section-divider" />

          <h2>11. Data retention</h2>
          <p>
            Email correspondence is retained for as long as reasonably necessary to fulfill the purpose of the communication. Anonymized analytics data is retained per Google Analytics' standard retention settings (26 months by default). We do not retain calculator inputs because they are never transmitted to us.
          </p>

          <hr className="section-divider" />

          <h2>12. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. If we make material changes, we will note them prominently. Your continued use of the Site after changes are posted constitutes your acceptance of the updated policy.
          </p>

          <hr className="section-divider" />

          <h2>13. Contact us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:
          </p>
          <div style={{ background: "#fff", border: `2px solid #E7E5E4`, borderRadius: 8, padding: 20, marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 4 }}>Guiders Network</div>
            <div style={{ fontSize: 15, color: "#44403C" }}>
              Email: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GREEN }}>{CONTACT_EMAIL}</a>
            </div>
            <div style={{ fontSize: 13, color: "#78716C", marginTop: 8 }}>
              We will respond to all privacy inquiries within 10 business days.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: INK, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `3px solid ${AMBER}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 900, color: "#fff" }}>BuildGuiders.com</div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/#calculators" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Calculators</a>
          <a href="/about" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>About</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#86efac", textDecoration: "none" }}>Privacy</a>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
