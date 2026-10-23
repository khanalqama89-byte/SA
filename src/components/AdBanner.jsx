import React, { useEffect } from 'react';

export default function AdBanner({ slot = '1234567890', format = 'auto', style = {} }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // Ad blocker or script not yet loaded
    }
  }, []);

  return (
    <div style={{
      margin: '2rem auto',
      textAlign: 'center',
      minHeight: '90px',
      maxWidth: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      ...style
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
