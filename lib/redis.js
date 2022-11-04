import { Client, Entity, Schema, Repository } from 'redis-om';

const client = new Client();

export async function connect(schema) {
	if (!client.isOpen()) {
		await client.open(process.env.REDIS_URL);
	}

	const repository = client.fetchRepository(schema);
	return repository;
}