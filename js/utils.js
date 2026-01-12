export function checkCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}
