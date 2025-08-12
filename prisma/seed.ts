import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
	const passwordHash = await hash('password123');

	const [alice, bob] = await Promise.all([
		prisma.user.upsert({
			where: { email: 'alice@example.com' },
			update: {},
			create: {
				email: 'alice@example.com',
				username: 'alice',
				name: 'Alice',
				image: 'https://i.pravatar.cc/200?u=alice',
				passwordHash,
			},
		}),
		prisma.user.upsert({
			where: { email: 'bob@example.com' },
			update: {},
			create: {
				email: 'bob@example.com',
				username: 'bob',
				name: 'Bob',
				image: 'https://i.pravatar.cc/200?u=bob',
				passwordHash,
			},
		}),
	]);

	await prisma.post.createMany({
		data: [
			{
				userId: alice.id,
				title: 'Hello World',
				content: 'First post content',
				image: null,
			},
			{
				userId: bob.id,
				title: 'Nice Day',
				content: 'Enjoying the sunshine',
				image: null,
			},
		],
	});

	console.log('Seed complete');
}

main().finally(async () => {
	await prisma.$disconnect();
});
