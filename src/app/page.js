"use client";
import Link from "next/link";
import InstantShareProvider from "@/app/InstantShareContext";

function Nav() {
  return (
    <nav className="nav">
      <div className="logo">Droply</div>
      <Link href="/" className="nav-item">Home</Link>
    </nav>
  );
}

function Landing() {
  return (
    <div className="view active" id="landing">
      <div className="hero">
        <div className="status">● Available Now</div>
        <h1 className="hero-title">Instant file sharing for<br/><i>anyone</i></h1>
        {/*<p className="subtitle">No cables. No accounts. No hassle. Just secure, instant file sharing between your devices with enterprise-grade security.</p>*/}
        <p className="subtitle">I was too lazy to use cables so I made this app instead...lol</p>
        <div className="features">
          <Link href="/receive" className="card card-interactive" role="button" tabIndex={0}>
            <h3 className="display-2">Receive files</h3>
            <p className="body mb-lg">Create a secure session on this device to receive files from your phone or another device. Generate a code instantly.</p>
            <div className="btn btn-primary btn-lg">Start Receiving →</div>
          </Link>
          <Link href="/send" className="card card-interactive" role="button" tabIndex={0}>
            <h3 className="display-2">Send files</h3>
            <p className="body mb-lg">Join an existing session with a code or QR scan to instantly share your files. Works with any file type.</p>
            <div className="btn btn-primary btn-lg">Start Sending →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <InstantShareProvider>
      <div className="container">
        <Nav />
        <Landing />
      </div>
    </InstantShareProvider>
  );
}
