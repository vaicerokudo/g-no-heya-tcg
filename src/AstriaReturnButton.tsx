function getReturnUrl() {
  const value = new URLSearchParams(window.location.search).get('returnTo');
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function AstriaReturnButton() {
  const returnUrl = getReturnUrl();
  if (!returnUrl) return null;
  return (
    <button className="global-astria-return" type="button" onClick={() => { window.location.href = returnUrl; }}>
      ↩ アストリアへ戻る
    </button>
  );
}
