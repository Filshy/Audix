export function cleanTrackTitle(title: string): string {
    if (!title) return '';

    let cleaned = title;

    // Remove common YouTube/download suffixes
    const suffixesToRemove = [
        / \(Official Video\)/gi,
        / \(Official Music Video\)/gi,
        / \(Official Audio\)/gi,
        / \(Audio\)/gi,
        / \(Lyric Video\)/gi,
        / \(Lyrics\)/gi,
        / \[Official Video\]/gi,
        / \[Official Music Video\]/gi,
        / \[Official Audio\]/gi,
        / \[Audio\]/gi,
        / \[Lyric Video\]/gi,
        / \[Lyrics\]/gi,
        / \(Music Video\)/gi,
        / \[Music Video\]/gi,
        / - HQ/gi,
        / \(HQ\)/gi,
        / - HD/gi,
        / \(HD\)/gi,
        / \(Audio Only\)/gi,
        / \[Audio Only\]/gi,
    ];

    for (const regex of suffixesToRemove) {
        cleaned = cleaned.replace(regex, '');
    }

    // Remove track numbers at the beginning (e.g., "01 - Song Title" -> "Song Title")
    cleaned = cleaned.replace(/^\d{1,2}\s*-\s*/, '');
    cleaned = cleaned.replace(/^\d{1,2}\.\s*/, '');
    cleaned = cleaned.replace(/^\d{1,2}\s+/, '');

    // Remove random alphanumeric strings sometimes prepended by downloaders
    // (e.g., "y2mate.com - Song Title" or random youtube IDs at the end)
    cleaned = cleaned.replace(/^y2mate\.com\s*-\s*/gi, '');
    cleaned = cleaned.replace(/ \[.*?\]$/gi, ''); // Removes trailing brackets like [youtubeID]

    // Remove Bitrates or quality tags like (320 kbps) or - 1080p
    cleaned = cleaned.replace(/\s*\(\s*\d+\s*kbp?s\s*\)/gi, '');
    cleaned = cleaned.replace(/\s*\[\s*\d+\s*kbp?s\s*\]/gi, '');
    cleaned = cleaned.replace(/\s*-\s*\d{3,4}p?/gi, '');
    cleaned = cleaned.replace(/\s*\(\s*\d{3,4}p?\s*\)/gi, '');

    // Remove YouTube generated IDs (11 chars usually) trailing like `- xR2y5uG1oPQ` 
    cleaned = cleaned.replace(/\s*(?:-|_)\s*[A-Za-z0-9_-]{11}\s*$/, '');

    // Remove stray trailing or leading standalone numbers 
    // This removes numbers left floating at the very end of the string.
    cleaned = cleaned.replace(/\s+\d+\s*$/, '');

    // Consolidate multiple spaces and hyphen issues
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/_-_/g, ' - ');
    cleaned = cleaned.replace(/_/g, ' ');

    return cleaned.trim();
}
