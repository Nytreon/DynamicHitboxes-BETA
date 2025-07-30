import values from "./config.json.js"

export default {
	get: (key, fallback) => values[ key ] ?? fallback,
	set: (key, value) => (value != null) ? (values[ key ] = value) : (void 0)
}
