export function Background() {
  // 25 particles
  const particles = Array.from({ length: 25 }, (_, i) => {
    const size = 1 + Math.random() * 2;
    const left = Math.random() * 100;
    const duration = 18 + Math.random() * 22;
    const delay = -Math.random() * duration;
    const opacity = 0.1 + Math.random() * 0.2;
    return (
      <span
        key={i}
        className="particle"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          bottom: `-10px`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          // @ts-ignore custom prop
          ["--p-opacity" as any]: opacity,
          opacity,
        }}
      />
    );
  });
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-violet" />
      <div className="orb orb-cyan" />
      <div className="orb orb-indigo" />
      {particles}
    </div>
  );
}
