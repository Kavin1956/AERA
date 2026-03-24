import React, { useEffect, useRef } from 'react';

function AuthWavesBackground() {
  const backgroundRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    if (
      !backgroundRef.current ||
      effectRef.current ||
      !window.VANTA ||
      !window.VANTA.WAVES ||
      !window.THREE
    ) {
      return undefined;
    }

    effectRef.current = window.VANTA.WAVES({
      el: backgroundRef.current,
      THREE: window.THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      color: 0x5588,
      shininess: 30,
      waveHeight: 15,
      waveSpeed: 1,
      zoom: 1
    });

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return <div className="auth-waves-background" ref={backgroundRef} aria-hidden="true" />;
}

export default AuthWavesBackground;
