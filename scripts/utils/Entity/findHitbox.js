/**
 * description: Find the hitbox of an entity in the world.
 * @param {import("@minecraft/server").Entity} entity - The entity to find the hitbox of.
 * @note all the 0.0001 values are to avoid raycasting issues with entities
 * @returns {Object|null} - An object containing the hitbox dimensions and offset
 */
export default function getEntityHitbox(entity, maxHeight = 10, maxWidth = maxHeight) {
	if (!entity?.isValid) return null;

	const direction = (x, y, z) => ({ x, y, z });
	const originOffset = direction;
	
	let entityLocation = entity.location;
	let dimension = entity.dimension

	const raycastDistance = (origin, directionVector, maxDistance) => {
		let rayDistance = dimension
			.getEntitiesFromRay(origin, directionVector, {
				type: entity.typeId,
				ignoreBlockCollision: true,
				maxDistance: maxDistance+2
			})
			?.find((hit) => hit.entity === entity)?.distance 
		
		return maxDistance - (rayDistance ?? maxDistance);
	}
	
	const upperHeight = raycastDistance(
		originOffset(entityLocation.x, entityLocation.y + maxHeight, entityLocation.z),
		direction(0, -1, 0), 
		maxHeight
	);
	const lowerHeight = raycastDistance(
		originOffset(entityLocation.x, entityLocation.y - maxHeight, entityLocation.z),
		direction(0, 1, 0),
		maxHeight
	);

	
	const rightWidth = raycastDistance(
		originOffset(entityLocation.x + maxWidth, entityLocation.y, entityLocation.z),
		direction(-1, 0.0001, 0),
		maxWidth
	);
	const leftWidth = raycastDistance(
		originOffset(entityLocation.x - maxWidth, entityLocation.y, entityLocation.z),
		direction(1, 0.0001, 0),
		maxWidth
	);
	
	const frontLength = raycastDistance(
		originOffset(entityLocation.x, entityLocation.y, entityLocation.z + maxWidth), 
		direction(0, 0.0001, -1),
		maxWidth
	);
	const backLength = raycastDistance(
		originOffset(entityLocation.x, entityLocation.y, entityLocation.z - maxWidth), 
		direction(0, 0.0001, 1),
		maxWidth
	);

	if (
		upperHeight + lowerHeight == 0  ||
		rightWidth + leftWidth == 0  ||
		frontLength + backLength == 0
	) {
		//debugging
		//console.warn("One or more hitbox ray distances returned 0. May be inaccurate. ", upperHeight + lowerHeight, rightWidth + leftWidth, frontLength + backLength )
		return null;
	}

	return {
		bound: {
			x: rightWidth + leftWidth,
			y: upperHeight + lowerHeight,
			z: frontLength + backLength,
		},
		boundLocationOffset: {
			x: -leftWidth,
			y: -lowerHeight,
			z: -backLength,
		},
	};
}
