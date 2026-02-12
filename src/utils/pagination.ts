export function parsePagination(query: any) {
	const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
	const cursor = query.cursor ? Number(query.cursor) : undefined;
	return { limit, cursor };
}
