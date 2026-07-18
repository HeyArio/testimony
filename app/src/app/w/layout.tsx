export const metadata = { robots: { index: false } };

// /w/* renders inside an iframe on OTHER people's sites — it must not bring
// its own page background. Cards carry their own surfaces; everything else
// shows the host page through.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body { background: transparent; }`}</style>
      {children}
    </>
  );
}
