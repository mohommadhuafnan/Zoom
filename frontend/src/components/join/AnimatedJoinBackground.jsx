export default function AnimatedJoinBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a1628]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a4d8f] to-[#0d2847] animate-gradient-shift" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-float-slow" />
      <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl animate-float-medium" />
      <div className="absolute -bottom-20 left-1/3 w-[28rem] h-[28rem] rounded-full bg-indigo-500/20 blur-3xl animate-float-slow-reverse" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-sky-400/10 blur-2xl animate-pulse-soft" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
