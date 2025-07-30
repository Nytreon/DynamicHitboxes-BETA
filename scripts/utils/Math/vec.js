export function sub (a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z,
	}
}

export function add (a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
		z: a.z + b.z,
	}
}

export function scale (a, n) {
	return {
		x: a.x * n,
		y: a.y * n,
		z: a.z * n,
	}
}

export function normalize ({ x, y, z }) {
	let mag = Math.hypot(x, y, z)
	
	if (mag === 0) return { x: 0, y: 0, z: 0 }
	
	return {
		x: x / mag,
		y: y / mag,
		z: z / mag
	}
} 

export function dot (v, u) {
	return u.x * v.x  +  u.y * v.y  +  u.z * v.z
}
