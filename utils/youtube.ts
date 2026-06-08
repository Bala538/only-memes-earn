export const getYouTubeId = (url: string | undefined | null): string | null => {
  if (!url) return null;
  const trimmedUrl = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  const match = trimmedUrl.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
