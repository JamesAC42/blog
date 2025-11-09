export function computeTilt(key: string): number {
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) + hash) + key.charCodeAt(i);
        hash |= 0;
    }
    const n = Math.abs(hash) % 7; // 0..6
    return n;
}